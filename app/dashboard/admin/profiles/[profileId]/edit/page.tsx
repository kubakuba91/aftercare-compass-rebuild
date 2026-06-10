import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { ProfileStatus, ProfileType, Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import { updateAdminAftercareProfile } from "../../../actions";

function fieldClassName() {
  return "min-h-11 rounded-md border border-border bg-white px-3 text-sm";
}

function moneyFieldClassName() {
  return "flex min-h-11 items-center rounded-md border border-border bg-white px-3 text-sm focus-within:ring-2 focus-within:ring-ring";
}

function moneyInputClassName() {
  return "min-h-10 flex-1 border-0 bg-transparent px-2 text-sm outline-none";
}

function labelClassName() {
  return "grid gap-2 text-sm font-medium";
}

function textareaClassName(size: "sm" | "lg" = "sm") {
  return `${size === "lg" ? "min-h-44" : "min-h-24"} rounded-md border border-border bg-white p-3 text-sm leading-6`;
}

function statusOptionLabel(status: ProfileStatus) {
  if (status === ProfileStatus.published) {
    return "Published";
  }

  if (status === ProfileStatus.unpublished) {
    return "Unpublished";
  }

  return "Draft";
}

function moneyValue(value: string | number | null | undefined) {
  const text = String(value ?? "").replace(/^\s*\$\s*/, "").trim();
  const match = text.match(/^\d+/);
  return match?.[0] ?? "";
}

export default async function AdminEditProfilePage({
  params
}: {
  params: Promise<{ profileId: string }>;
}) {
  const [appUser, { profileId }] = await Promise.all([
    getProtectedAppUser("/dashboard/admin"),
    params
  ]);

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    include: {
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!profile) {
    redirect("/dashboard/admin?tab=profiles&reviewMessage=Listing%20was%20not%20found.");
  }

  return (
    <main className="shell py-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/dashboard/admin?tab=profiles">
        <ArrowLeft size={16} />
        Back to homes & programs
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{profile.type === ProfileType.sober_living ? "Sober Living" : "Continued Care"}</Badge>
            <Badge tone={profile.status === ProfileStatus.published ? "success" : "warning"}>
              {statusOptionLabel(profile.status)}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Edit listing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Update the system admin version of this home or program listing.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <section>
          <form action={updateAdminAftercareProfile} className="grid gap-5" encType="multipart/form-data" id="admin-edit-profile-form">
            <input name="profileId" type="hidden" value={profile.id} />
            <Card className="grid gap-4">
              <div>
                <h2 className="text-lg font-semibold">Program basics</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Public identity, location, and admissions contact information.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClassName()}>
                  Listing type
                  <input
                    className={fieldClassName()}
                    disabled
                    value={profile.type === ProfileType.sober_living ? "Sober living home" : "Continued care program"}
                  />
                </label>
                <label className={labelClassName()}>
                  Program name
                  <input className={fieldClassName()} defaultValue={profile.programName} name="programName" required />
                </label>
                <label className={labelClassName()}>
                  Street address
                  <input className={fieldClassName()} defaultValue={profile.streetAddress || ""} name="streetAddress" />
                </label>
                <label className={labelClassName()}>
                  City
                  <input className={fieldClassName()} defaultValue={profile.city} name="city" required />
                </label>
                <label className={labelClassName()}>
                  State
                  <input className={fieldClassName()} defaultValue={profile.state} maxLength={2} name="state" required />
                </label>
                <label className={labelClassName()}>
                  ZIP
                  <input className={fieldClassName()} defaultValue={profile.zip || ""} name="zip" />
                </label>
                <label className={labelClassName()}>
                  Admissions phone
                  <input className={fieldClassName()} defaultValue={profile.admissionsContactPhone || ""} name="admissionsContactPhone" />
                </label>
                <label className={labelClassName()}>
                  Admissions email
                  <input className={fieldClassName()} defaultValue={profile.admissionsContactEmail || ""} name="admissionsContactEmail" type="email" />
                </label>
                <label className={labelClassName()}>
                  Website URL
                  <input className={fieldClassName()} defaultValue={profile.websiteUrl || ""} name="websiteUrl" placeholder="https://example.com" type="url" />
                </label>
              </div>
            </Card>

            <Card className="grid gap-4">
              <div>
                <h2 className="text-lg font-semibold">Availability</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Keep the public availability summary current.
                </p>
              </div>
              {profile.type === ProfileType.sober_living ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClassName()}>
                    Price per week
                    <span className={moneyFieldClassName()}>
                      <span className="font-semibold text-muted-foreground">$</span>
                      <input className={moneyInputClassName()} defaultValue={moneyValue(profile.pricePerWeek)} inputMode="numeric" min="0" name="pricePerWeek" type="number" />
                    </span>
                  </label>
                  <label className={labelClassName()}>
                    Cost to move in
                    <span className={moneyFieldClassName()}>
                      <span className="font-semibold text-muted-foreground">$</span>
                      <input className={moneyInputClassName()} defaultValue={moneyValue(profile.moveInCost)} inputMode="numeric" min="0" name="moveInCost" placeholder="600" type="number" />
                    </span>
                  </label>
                </div>
              ) : (
                <label className={labelClassName()}>
                  Accepting new patients
                  <select className={fieldClassName()} defaultValue={profile.acceptingNewPatients ? "yes" : "no"} name="acceptingNewPatients">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              )}
              <label className={labelClassName()}>
                Availability notes
                <textarea className={textareaClassName()} defaultValue={profile.availabilityNotes || ""} name="availabilityNotes" />
              </label>
            </Card>

            <Card className="grid gap-4">
              <div>
                <h2 className="text-lg font-semibold">Profile content</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Public profile description shown on the marketplace profile page.
                </p>
              </div>
              <label className={labelClassName()}>
                Description
                <textarea className={textareaClassName("lg")} defaultValue={profile.description || ""} name="description" />
              </label>
            </Card>

            <Card className="grid gap-4">
              <div>
                <h2 className="text-lg font-semibold">Profile images</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Add additional images to this listing. Existing images stay attached.
                </p>
              </div>
              {profile.images.length ? (
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  {profile.images.length} existing image{profile.images.length === 1 ? "" : "s"} attached
                </div>
              ) : null}
              <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
                <input
                  accept="image/*"
                  className="block w-full text-sm font-medium text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                  multiple
                  name="images"
                  type="file"
                />
              </div>
            </Card>
          </form>
        </section>

        <aside className="grid h-fit gap-4 lg:sticky lg:top-6">
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            form="admin-edit-profile-form"
          >
            <Save size={16} />
            Save changes
          </button>

          <Card>
            <ShieldCheck className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Publishing</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Unpublished listings are hidden from public search but remain available to admins.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Status
              <select className={fieldClassName()} defaultValue={profile.status} form="admin-edit-profile-form" name="status">
                <option value={ProfileStatus.published}>Published</option>
                <option value={ProfileStatus.draft}>Draft</option>
                <option value={ProfileStatus.unpublished}>Unpublished</option>
              </select>
            </label>
          </Card>

          <Card>
            <h2 className="font-semibold">Public preview</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Check how this profile appears before or after saving edits.
            </p>
            <Link className="mt-4 inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold" href={`/profiles/${profile.slug}?preview=1`}>
              View profile
            </Link>
          </Card>
        </aside>
      </div>
    </main>
  );
}
