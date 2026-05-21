import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { ProfileStatus, ProfileType, Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { createUnclaimedAftercareProfile } from "../../actions";

function fieldClassName() {
  return "min-h-11 rounded-md border border-border bg-white px-3 text-sm";
}

function labelClassName() {
  return "grid gap-2 text-sm font-medium";
}

function SectionIntro({
  children,
  title
}: {
  children?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="border-b border-border bg-muted/20 px-5 py-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{children}</p> : null}
    </div>
  );
}

export default async function AdminCreateProfilePage() {
  const appUser = await getProtectedAppUser("/dashboard/admin/profiles/new");

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
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
            <Badge tone="warning">Unclaimed listing</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Add new home</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a public directory profile before the provider claims it.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section>
          <form action={createUnclaimedAftercareProfile} className="grid gap-5" id="admin-create-profile-form">
            <Card className="overflow-hidden p-0" id="basics">
              <SectionIntro title="Program basics">
                Public identity, listing type, location, and admissions contact information.
              </SectionIntro>
              <div className="grid gap-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClassName()}>
                    Listing type
                    <select className={fieldClassName()} name="type">
                      <option value={ProfileType.sober_living}>Sober living home</option>
                      <option value={ProfileType.continued_care}>Continued care program</option>
                    </select>
                  </label>
                  <label className={labelClassName()}>
                    Program name
                    <input className={fieldClassName()} name="programName" required />
                  </label>
                  <label className={labelClassName()}>
                    Street address
                    <input className={fieldClassName()} name="streetAddress" />
                  </label>
                  <label className={labelClassName()}>
                    City
                    <input className={fieldClassName()} name="city" required />
                  </label>
                  <label className={labelClassName()}>
                    State
                    <input className={fieldClassName()} maxLength={2} name="state" required />
                  </label>
                  <label className={labelClassName()}>
                    ZIP
                    <input className={fieldClassName()} name="zip" />
                  </label>
                  <label className={labelClassName()}>
                    Admissions phone
                    <input className={fieldClassName()} name="admissionsContactPhone" />
                  </label>
                  <label className={labelClassName()}>
                    Admissions email
                    <input className={fieldClassName()} name="admissionsContactEmail" type="email" />
                  </label>
                  <label className={labelClassName()}>
                    Website URL
                    <input className={fieldClassName()} name="websiteUrl" type="url" />
                  </label>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden p-0" id="content">
              <SectionIntro title="Profile content">
                Add enough context for the public profile to feel useful before the provider claims it.
              </SectionIntro>
              <div className="grid gap-4 p-5">
                <label className={labelClassName()}>
                  Short description
                  <textarea className="min-h-44 rounded-md border border-border bg-white p-3 text-sm leading-6" name="description" />
                </label>
              </div>
            </Card>
          </form>
        </section>

        <aside className="grid h-fit gap-4 lg:sticky lg:top-6">
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            form="admin-create-profile-form"
          >
            <Save size={16} />
            Create listing
          </button>

          <Card>
            <ShieldCheck className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Publishing</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              New admin-created profiles are unclaimed. Publish now for the directory, or save as draft for internal cleanup.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Initial status
              <select className={fieldClassName()} form="admin-create-profile-form" name="status">
                <option value={ProfileStatus.published}>Published</option>
                <option value={ProfileStatus.draft}>Draft</option>
              </select>
            </label>
          </Card>

          <Card>
            <h2 className="font-semibold">Claim workflow</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Providers will claim this listing from the public profile. Admin approval transfers it to their organization.
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}
