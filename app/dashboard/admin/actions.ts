"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminReviewStatus, AdminReviewSubjectType, OrganizationType, Role } from "@prisma/client";
import { notifyProfileClaimApproved, notifyProfileClaimRejected } from "@/lib/email-notifications";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";

function adminReviewHref(message: string) {
  const params = new URLSearchParams({
    tab: "verification",
    reviewMessage: message
  });

  return `/dashboard/admin?${params.toString()}`;
}

function adminClaimHref(message: string) {
  const params = new URLSearchParams({
    tab: "claims",
    reviewMessage: message
  });

  return `/dashboard/admin?${params.toString()}`;
}

export async function reviewOnboardingSubmission(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const reviewId = String(formData.get("reviewId") || "");
  const decision = String(formData.get("decision") || "");
  const reviewerNotes = String(formData.get("reviewerNotes") || "").trim() || null;

  if (!reviewId || (decision !== "approved" && decision !== "rejected")) {
    redirect(adminReviewHref("Choose approve or reject for a valid application."));
  }

  const review = await prisma.adminReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      subjectType: true,
      status: true,
      profileId: true,
      organization: {
        select: {
          name: true
        }
      },
      profile: {
        select: {
          programName: true
        }
      }
    }
  });

  if (!review) {
    redirect(adminReviewHref("Application review was not found."));
  }

  if (review.status !== AdminReviewStatus.pending) {
    redirect(adminReviewHref("This application has already been reviewed."));
  }

  const nextStatus = decision === "approved" ? AdminReviewStatus.approved : AdminReviewStatus.rejected;

  await prisma.$transaction(async (tx) => {
    await tx.adminReview.update({
      where: { id: review.id },
      data: {
        status: nextStatus,
        reviewerNotes,
        reviewedByUserId: appUser.id,
        reviewedAt: new Date()
      }
    });

    if (
      nextStatus === AdminReviewStatus.approved &&
      review.subjectType === AdminReviewSubjectType.aftercare_profile &&
      review.profileId
    ) {
      await tx.aftercareProfile.update({
        where: { id: review.profileId },
        data: {
          verificationTier: 2
        }
      });
    }
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  if (review.profileId) {
    revalidatePath("/profiles/[slug]", "page");
  }

  const subjectName = review.profile?.programName || review.organization.name;
  redirect(adminReviewHref(`${subjectName} ${decision}.`));
}

export async function reviewProfileClaimRequest(formData: FormData) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const claimRequestId = String(formData.get("claimRequestId") || "");
  const decision = String(formData.get("decision") || "");
  const reviewerNotes = String(formData.get("reviewerNotes") || "").trim() || null;

  if (!claimRequestId || (decision !== "approved" && decision !== "rejected")) {
    redirect(adminClaimHref("Choose approve or reject for a valid claim."));
  }

  const claim = await prisma.profileClaimRequest.findUnique({
    where: { id: claimRequestId },
    include: {
      claimantUser: {
        include: {
          organization: true
        }
      },
      profile: {
        select: {
          id: true,
          orgId: true,
          type: true,
          slug: true,
          programName: true,
          ownershipStatus: true,
          verificationTier: true
        }
      }
    }
  });

  if (!claim) {
    redirect(adminClaimHref("Claim request was not found."));
  }

  if (claim.status !== "pending") {
    redirect(adminClaimHref("This claim has already been reviewed."));
  }

  if (decision === "approved") {
    const claimantOrg = claim.claimantUser?.organization;
    const requiredOrgType =
      claim.profile.type === "sober_living"
        ? OrganizationType.aftercare_sober_living
        : OrganizationType.aftercare_continued_care;

    if (!claim.claimantUser || !claim.claimantUser.orgId || claimantOrg?.type !== requiredOrgType) {
      redirect(adminClaimHref("The claimant does not have a matching aftercare organization."));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.profileClaimRequest.update({
      where: { id: claim.id },
      data: {
        status: decision === "approved" ? "approved" : "rejected",
        reviewerNotes,
        reviewedByUserId: appUser.id,
        reviewedAt: new Date()
      }
    });

    if (decision === "approved") {
      await tx.aftercareProfile.update({
        where: { id: claim.profileId },
        data: {
          orgId: claim.claimantUser!.orgId!,
          ownershipStatus: "claimed",
          claimedAt: new Date(),
          claimedByUserId: claim.claimantUser!.id,
          verificationTier: Math.max(claim.profile.verificationTier, 2)
        }
      });

      await tx.profileClaimRequest.updateMany({
        where: {
          profileId: claim.profileId,
          status: "pending",
          NOT: { id: claim.id }
        },
        data: {
          status: "cancelled",
          reviewerNotes: "Cancelled because another claim was approved.",
          reviewedByUserId: appUser.id,
          reviewedAt: new Date()
        }
      });
    } else {
      await tx.aftercareProfile.update({
        where: { id: claim.profileId },
        data: {
          ownershipStatus: "unclaimed"
        }
      });
    }

    await tx.adminAuditLog.create({
      data: {
        actorUserId: appUser.id,
        action: decision === "approved" ? "profile_claim_approved" : "profile_claim_rejected",
        entityType: "ProfileClaimRequest",
        entityId: claim.id,
        metadata: {
          profileId: claim.profileId,
          profileName: claim.profile.programName,
          claimantEmail: claim.claimantEmail,
          claimantUserId: claim.claimantUserId,
          previousOrgId: claim.profile.orgId,
          newOrgId: decision === "approved" ? claim.claimantUser?.orgId : null
        }
      }
    });
  });

  if (decision === "approved") {
    await notifyProfileClaimApproved(claim.id);
  } else {
    await notifyProfileClaimRejected(claim.id);
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/search");
  revalidatePath(`/profiles/${claim.profile.slug}`);

  redirect(adminClaimHref(`${claim.profile.programName} claim ${decision}.`));
}
