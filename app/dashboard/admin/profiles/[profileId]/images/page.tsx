import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ImagePlus, Star, Trash2 } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { ProfileImageUploader } from "@/components/dashboard/profile-image-uploader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPhotoLimit, getAftercarePhotoLimit } from "@/lib/feature-gates";
import { prisma } from "@/lib/prisma";
import { getProtectedAppUser } from "@/lib/protected-routing";
import {
  removeAdminProfileImage,
  setAdminProfileCoverImage,
  uploadAdminProfileImages
} from "../../../actions";

export default async function AdminProfileImagesPage({
  params,
  searchParams
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const appUser = await getProtectedAppUser("/dashboard/admin");

  if (appUser.role !== "system_admin") {
    redirect("/dashboard");
  }

  const { profileId } = await params;
  const { message } = await searchParams;
  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    include: {
      organization: {
        select: {
          name: true,
          subscriptionPlan: true
        }
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!profile) {
    notFound();
  }

  const photoLimit = getAftercarePhotoLimit(profile.organization.subscriptionPlan);

  return (
    <main className="min-h-screen bg-surface-secondary px-4 py-8">
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/dashboard/admin?tab=profiles">
          <ArrowLeft size={16} />
          Back to homes & programs
        </Link>

        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">System admin</p>
            <h1 className="mt-2 text-3xl font-semibold">Manage profile images</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.programName} · {profile.organization.name}
            </p>
          </div>
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/20 px-5 py-4">
            <h2 className="text-lg font-semibold">Profile images</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Upload images for public search cards and the profile page. Current plan includes {formatPhotoLimit(photoLimit)}.
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-3">
              <ImagePlus className="mt-1 text-primary" size={24} />
              <div>
                <p className="text-sm font-semibold">Add images</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The first uploaded image becomes the cover. You can change the cover below.
                </p>
              </div>
            </div>

            <form action={uploadAdminProfileImages} className="mt-5 grid gap-3 rounded-md border border-dashed border-border bg-muted/30 p-4">
              <input name="profileId" type="hidden" value={profile.id} />
              <ProfileImageUploader currentImageCount={profile.images.length} photoLimit={photoLimit} />
            </form>

            {profile.images.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {profile.images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-md border border-border bg-white">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        alt={image.altText || profile.programName}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 420px, 100vw"
                        src={image.url}
                        unoptimized
                      />
                      {image.isCover ? (
                        <Badge className="absolute left-3 top-3" tone="verified">
                          Cover
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {!image.isCover ? (
                        <form action={setAdminProfileCoverImage}>
                          <input name="profileId" type="hidden" value={profile.id} />
                          <input name="imageId" type="hidden" value={image.id} />
                          <button className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold">
                            <Star size={15} />
                            Make cover
                          </button>
                        </form>
                      ) : null}
                      <form action={removeAdminProfileImage}>
                        <input name="profileId" type="hidden" value={profile.id} />
                        <input name="imageId" type="hidden" value={image.id} />
                        <ConfirmSubmitButton
                          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-destructive"
                          message="Remove this image from the profile?"
                        >
                          <Trash2 size={15} />
                          Remove
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ac-panel-card mt-5 p-4 text-sm text-muted-foreground">
                No images uploaded yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
