import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, ImagePlus, Sparkles } from "lucide-react";
import { ProfileImageUploader } from "@/components/dashboard/profile-image-uploader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPhotoLimit, getAftercarePhotoLimit } from "@/lib/feature-gates";
import { prisma } from "@/lib/prisma";
import { getAftercareDashboardUser } from "@/lib/protected-routing";
import { uploadCompletedAftercareOnboardingImages } from "../actions";

export default async function AftercareOnboardingImagesPage({
  searchParams
}: {
  searchParams: Promise<{ profileId?: string; message?: string }>;
}) {
  const [appUser, query] = await Promise.all([
    getAftercareDashboardUser("/onboarding/aftercare/images"),
    searchParams
  ]);

  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: query.profileId || undefined,
      orgId: appUser.orgId
    },
    include: {
      organization: {
        select: { subscriptionPlan: true }
      },
      _count: {
        select: { images: true }
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!profile) {
    redirect("/dashboard/aftercare");
  }

  const photoLimit = getAftercarePhotoLimit(profile.organization.subscriptionPlan);

  return (
    <main className="min-h-screen bg-surface-secondary px-4 py-10">
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
            <Sparkles size={30} />
          </div>
          <Badge className="mt-5" tone="success">Profile created</Badge>
          <h1 className="mt-4 text-3xl font-semibold">Add profile images</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add photos for {profile.programName}. These images will appear on search cards and public profile pages.
          </p>
        </div>

        {query.message ? (
          <div className="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm font-semibold text-primary">
            {query.message}
          </div>
        ) : null}

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-white px-5 py-4">
            <div className="flex items-start gap-3">
              <ImagePlus className="mt-1 text-primary" size={24} />
              <div>
                <h2 className="text-lg font-semibold">Upload images</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Current plan includes {formatPhotoLimit(photoLimit)}. You can also add or manage images later from the dashboard.
                </p>
              </div>
            </div>
          </div>

          <form action={uploadCompletedAftercareOnboardingImages} className="grid gap-4 p-5" encType="multipart/form-data">
            <input name="profileId" type="hidden" value={profile.id} />
            <ProfileImageUploader currentImageCount={profile._count.images} photoLimit={photoLimit} />
          </form>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-white px-5 py-4">
            <h2 className="text-lg font-semibold">Uploaded photos</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              These photos are saved to the profile.
            </p>
          </div>
          <div className="p-5">
            {profile.images.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-md border border-border bg-white">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        alt={image.altText || profile.programName}
                        className="object-cover"
                        fill
                        sizes="(min-width: 768px) 360px, 100vw"
                        src={image.url}
                        unoptimized
                      />
                      {image.isCover ? (
                        <Badge className="absolute left-3 top-3" tone="verified">
                          Cover
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
                No photos uploaded yet.
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm"
            href={`/dashboard/aftercare/profiles/${profile.id}`}
          >
            Manage profile
          </Link>
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#121b57] px-5 text-sm font-semibold text-white shadow-sm"
            href="/dashboard/aftercare"
          >
            <CheckCircle2 size={16} />
            Done
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
