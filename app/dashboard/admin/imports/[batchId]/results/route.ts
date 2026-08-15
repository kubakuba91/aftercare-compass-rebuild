import { Role } from "@prisma/client";
import { getCurrentAppUser } from "@/lib/current-user";
import { rowsToResultsCsv } from "@/lib/provider-csv-import";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const user = await getCurrentAppUser();
  if (user?.role !== Role.system_admin) return new Response("Forbidden", { status: 403 });
  const { batchId } = await params;
  const batch = await prisma.providerImportBatch.findUnique({
    where: { id: batchId },
    include: { rows: { orderBy: { rowNumber: "asc" } } }
  });
  if (!batch) return new Response("Not found", { status: 404 });

  return new Response(rowsToResultsCsv(batch.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="provider-import-${batch.id}-results.csv"`,
      "Cache-Control": "private, no-store"
    }
  });
}
