import Image from "next/image";
import { notFound } from "next/navigation";
import { ProfileStatus } from "@prisma/client";
import { BackLink } from "@/components/public/back-link";
import { PublicSearchHeader } from "@/components/public/public-search-header";
import { Card } from "@/components/ui/card";
import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilePhotosPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const [{ slug }, query, appUser] = await Promise.all([
    params,
    searchParams,
    getCurrentAppUser()
  ]);

  const profile = await prisma.aftercareProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      orgId: true,
      programName: true,
      publicCity: true,
      publicState: true,
      slug: true,
      status: true,
      type: true,
      acceptingNewPatients: true,
      bedsAvailable: true,
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          altText: true,
          url: true
        }
      }
    }
  });

  if (!profile) {
    notFound();
  }

  const canPreviewDraft =
    query.preview === "1" &&
    appUser?.orgId === profile.orgId &&
    appUser.role.startsWith("aftercare");

  if (profile.status !== ProfileStatus.published && !canPreviewDraft) {
    notFound();
  }

  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");

  return (
    <>
      <PublicSearchHeader
        defaultLocation={publicLocation}
        defaultType={profile.type}
        defaultAvailability={(profile.type === "sober_living" ? profile.bedsAvailable : profile.acceptingNewPatients) ? "available" : ""}
        isSignedIn={Boolean(appUser)}
      />
      <main className="shell py-8">
        <div className="mb-5">
          <BackLink
            href={`/profiles/${profile.slug}${canPreviewDraft ? "?preview=1" : ""}`}
          >
            Back to profile
          </BackLink>
        </div>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{publicLocation || "Location not listed"}</p>
              <h1 className="mt-2 text-3xl font-semibold">{profile.programName} photos</h1>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {profile.images.length} photo{profile.images.length === 1 ? "" : "s"}
            </p>
          </div>

          {profile.images.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.images.map((image) => (
                <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-border bg-muted">
                  <Image
                    alt={image.altText || profile.programName}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
                    src={image.url}
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-border bg-surface-secondary p-6">
              <p className="text-sm font-semibold">No photos uploaded yet</p>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
