"use server";

import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { commitProviderImportRow, type NormalizedProviderImportRow, validateProviderCsv } from "@/lib/provider-csv-import";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";

function importHref(message: string, tone: "success" | "error" = "error") {
  return `/dashboard/admin/imports?${new URLSearchParams({ message, tone }).toString()}`;
}

export async function uploadProviderCsv(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin/imports");
  if (appUser.role !== Role.system_admin) redirect("/dashboard");

  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) redirect(importHref("Choose a CSV file to upload."));
  if (!file.name.toLowerCase().endsWith(".csv")) redirect(importHref("The upload must be a .csv file."));
  if (file.size > 10 * 1024 * 1024) redirect(importHref("The CSV must be 10 MB or smaller."));

  let rows;
  try {
    rows = await validateProviderCsv(await file.text());
  } catch (error) {
    redirect(importHref(error instanceof Error ? error.message : "The CSV could not be parsed."));
  }

  const newOrgKeys = new Set(
    rows.filter((row) => row.previewAction === "create" && !row.organizationId && row.normalizedData)
      .map((row) => row.normalizedData!.orgId || row.normalizedData!.organizationName.toLowerCase())
  );
  const batch = await prisma.providerImportBatch.create({
    data: {
      actorUserId: appUser.id,
      sourceFileName: file.name.slice(0, 255),
      totalRows: rows.length,
      newOrganizationCount: newOrgKeys.size,
      newLocationCount: rows.filter((row) => row.previewAction === "create").length,
      matchedLocationCount: rows.filter((row) => row.previewAction === "update").length,
      rejectedRowCount: rows.filter((row) => row.previewAction === "reject").length,
      rows: {
        create: rows.map((row) => ({
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          normalizedData: row.normalizedData
            ? row.normalizedData as unknown as Prisma.InputJsonValue
            : undefined,
          previewAction: row.previewAction,
          status: row.previewAction === "reject" ? "rejected" : "validated",
          errorReasons: row.errorReasons,
          organizationId: row.organizationId,
          profileId: row.profileId
        }))
      }
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: appUser.id,
      action: "provider_csv_validated",
      entityType: "ProviderImportBatch",
      entityId: batch.id,
      metadata: { sourceFileName: file.name, totalRows: rows.length, rejectedRows: batch.rejectedRowCount }
    }
  });

  redirect(`/dashboard/admin/imports/${batch.id}`);
}

export async function commitProviderCsv(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin/imports");
  if (appUser.role !== Role.system_admin) redirect("/dashboard");

  const batchId = String(formData.get("batchId") || "");
  const claimed = await prisma.providerImportBatch.updateMany({
    where: { id: batchId, status: "validated" },
    data: { status: "committing" }
  });
  if (!claimed.count) redirect(importHref("This import was already committed or is no longer available."));

  const rows = await prisma.providerImportRow.findMany({
    where: { importBatchId: batchId, status: "validated" },
    orderBy: { rowNumber: "asc" }
  });
  let failed = 0;

  for (const row of rows) {
    try {
      await commitProviderImportRow({
        actorUserId: appUser.id,
        rowId: row.id,
        normalized: row.normalizedData as unknown as NormalizedProviderImportRow,
        organizationId: row.organizationId,
        profileId: row.profileId
      });
    } catch (error) {
      failed += 1;
      await prisma.providerImportRow.update({
        where: { id: row.id },
        data: {
          status: "failed",
          previewAction: "failed",
          errorReasons: [error instanceof Error ? error.message : "Unexpected database error."],
          resultMessage: "Row was not committed."
        }
      });
    }
  }

  await prisma.$transaction([
    prisma.providerImportBatch.update({
      where: { id: batchId },
      data: { status: failed ? "completed_with_errors" : "committed", committedAt: new Date() }
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: appUser.id,
        action: "provider_csv_committed",
        entityType: "ProviderImportBatch",
        entityId: batchId,
        metadata: { attemptedRows: rows.length, failedRows: failed }
      }
    })
  ]);

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/imports");
  revalidatePath(`/dashboard/admin/imports/${batchId}`);
  revalidatePath("/search");
  redirect(`/dashboard/admin/imports/${batchId}?committed=1`);
}
