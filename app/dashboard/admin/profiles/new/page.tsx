import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { ProfileStatus, ProfileType, Role } from "@prisma/client";
import { PopulationBedFields } from "@/components/dashboard/population-bed-fields";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  amenityOptions,
  bedTypeOptions,
  certificationOptions,
  drugTestingPolicyOptions,
  insuranceOptions,
  matOptions,
  medicationAdministrationOptions,
  populationOptions,
  preferredContactOptions,
  roomTypeOptions,
  specialtyPopulationOptions,
  supportServiceOptions
} from "@/lib/sober-living-onboarding";
import {
  levelOfCareOptions,
  programTypeOptions,
  telehealthModeOptions
} from "@/lib/continued-care-onboarding";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { createUnclaimedAftercareProfile } from "../../actions";

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

function CheckboxGroup({
  label,
  name,
  options
}: {
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <MultiSelectDropdown
        name={name}
        options={options}
        placeholder={`Select ${label.toLowerCase()}...`}
        selected={[]}
      />
    </fieldset>
  );
}

export default async function AdminCreateProfilePage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [appUser, query] = await Promise.all([
    getProtectedAppUser("/dashboard/admin/profiles/new"),
    searchParams
  ]);
  const initialType = query.type === ProfileType.continued_care ? ProfileType.continued_care : ProfileType.sober_living;

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
          <form action={createUnclaimedAftercareProfile} className="admin-create-profile-form grid gap-5" encType="multipart/form-data" id="admin-create-profile-form">
            <Card className="overflow-hidden p-0" id="basics">
              <SectionIntro title="Program basics">
                Public identity, listing type, location, and admissions contact information.
              </SectionIntro>
              <div className="grid gap-4 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClassName()}>
                    Listing type
                    <select className={fieldClassName()} defaultValue={initialType} name="type">
                      <option value={ProfileType.sober_living}>Sober living home</option>
                      <option value={ProfileType.continued_care}>Continued care program</option>
                    </select>
                  </label>
                  <label className={labelClassName()}>
                    Program name
                    <input className={fieldClassName()} name="programName" required />
                  </label>
                  <label className={labelClassName()}>
                    Preferred contact method
                    <select className={fieldClassName()} name="preferredContactMethod">
                      <option value="">Select one</option>
                      {preferredContactOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClassName()}>
                    Intake contact name
                    <input className={fieldClassName()} name="intakeContactName" />
                  </label>
                  <label className={labelClassName()}>
                    License number
                    <input className={fieldClassName()} name="stateLicenseNumber" />
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

            <Card className="overflow-hidden p-0" id="availability">
              <SectionIntro title="Availability">
                Capture the same bed, pricing, program, and intake details that appear on provider edit screens.
              </SectionIntro>
              <div className="grid gap-5 p-5">
                <div className="admin-profile-type-section admin-profile-type-section--sober-living grid gap-5">
                  <div className="grid gap-2">
                    <p className="text-sm font-semibold">Sober living availability</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Used when the listing type is Sober living home.
                    </p>
                  </div>
                    <CheckboxGroup label="Population served" name="populationServedOptions" options={populationOptions} />
                  <PopulationBedFields
                    initialPopulations={[]}
                    values={{
                    bedsLgbtq: 0,
                    bedsLgbtqAvailable: 0,
                    bedsMen: 0,
                    bedsMenAvailable: 0,
                    bedsWomen: 0,
                    bedsWomenAvailable: 0
                    }}
                  />
                  <CheckboxGroup label="Room types" name="roomTypes" options={roomTypeOptions} />
                  <CheckboxGroup label="Bed types" name="bedTypes" options={bedTypeOptions} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={labelClassName()}>
                      Price per week
                      <span className={moneyFieldClassName()}>
                        <span className="font-semibold text-muted-foreground">$</span>
                        <input className={moneyInputClassName()} inputMode="numeric" min="0" name="pricePerWeek" type="number" />
                      </span>
                    </label>
                    <label className={labelClassName()}>
                      Cost to move in
                      <span className={moneyFieldClassName()}>
                        <span className="font-semibold text-muted-foreground">$</span>
                        <input className={moneyInputClassName()} inputMode="numeric" min="0" name="moveInCost" placeholder="600" type="number" />
                      </span>
                    </label>
                    <label className={labelClassName()}>
                      Wheelchair accessible bed count
                      <input className={fieldClassName()} min="0" name="wheelchairAccessibleBeds" type="number" />
                    </label>
                  </div>
                  <label className={labelClassName()}>
                    Reserved beds notes
                    <textarea className={textareaClassName()} name="bedsReservedNotes" />
                  </label>
                </div>

                <div className="admin-profile-type-section admin-profile-type-section--continued-care border-t border-border pt-5">
                  <div className="grid gap-2">
                    <p className="text-sm font-semibold">Continued care availability</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Used when the listing type is Continued care program.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className={labelClassName()}>
                      Accepting new patients
                      <select className={fieldClassName()} name="acceptingNewPatients">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                    <label className={labelClassName()}>
                      Telehealth mode
                      <select className={fieldClassName()} name="telehealthMode">
                        <option value="">Select one</option>
                        {telehealthModeOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <CheckboxGroup label="Program types" name="programTypes" options={programTypeOptions} />
                    <CheckboxGroup label="Levels of care" name="levelsOfCare" options={levelOfCareOptions} />
                    <label className={labelClassName()}>
                      Hours of operation
                      <textarea className={textareaClassName()} name="hoursOfOperation" />
                    </label>
                  </div>
                </div>

                <label className={labelClassName()}>
                  Availability notes
                  <textarea className={textareaClassName()} name="availabilityNotes" />
                </label>
              </div>
            </Card>

            <Card className="overflow-hidden p-0" id="content">
              <SectionIntro title="Profile content">
                Add enough context for the public profile to feel useful before the provider claims it.
              </SectionIntro>
              <div className="grid gap-5 p-5">
                <label className={labelClassName()}>
                  Description
                  <textarea className={textareaClassName("lg")} name="description" />
                </label>
                <label className={labelClassName()}>
                  House rules
                  <textarea className={textareaClassName("lg")} name="houseRulesText" />
                </label>
                <label className={labelClassName()}>
                  Referral fit notes
                  <textarea className={textareaClassName("lg")} name="referralFitNotes" />
                </label>
                <div className="admin-profile-type-section admin-profile-type-section--continued-care">
                  <label className={labelClassName()}>
                    Referral process
                    <textarea className={textareaClassName("lg")} name="referralProcessDescription" />
                  </label>
                </div>
                <CheckboxGroup label="Specialty populations" name="specialtyPopulations" options={specialtyPopulationOptions} />
                <CheckboxGroup label="Certifications held" name="certificationsHeld" options={certificationOptions} />
                <CheckboxGroup label="Support services" name="supportServices" options={supportServiceOptions} />
                <div className="admin-profile-type-section admin-profile-type-section--sober-living">
                  <CheckboxGroup label="Amenities" name="amenities" options={amenityOptions} />
                </div>
                <CheckboxGroup label="Insurance/payment accepted" name="insuranceAccepted" options={insuranceOptions} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClassName()}>
                    Funding available
                    <select className={fieldClassName()} name="fundingAvailable">
                      <option value="">Not set</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className={labelClassName()}>
                    Medication administration
                    <select className={fieldClassName()} name="medicationAdministration">
                      <option value="">Not set</option>
                      {medicationAdministrationOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className={labelClassName()}>
                  Funding notes
                  <textarea className={textareaClassName()} name="fundingNotes" />
                </label>
                <CheckboxGroup label="MAT accepted" name="matAccepted" options={matOptions} />
                <label className={labelClassName()}>
                  Medication restrictions
                  <textarea className={textareaClassName()} name="medicationRestrictions" />
                </label>
                <label className={labelClassName()}>
                  Drug testing policy
                  <select className={fieldClassName()} name="drugTestingPolicy">
                    <option value="">Not set</option>
                    {drugTestingPolicyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div className="admin-profile-type-section admin-profile-type-section--sober-living">
                  <label className="ac-panel-card flex items-start gap-3 p-4 text-sm">
                    <input name="goodNeighborPolicyAcknowledged" type="checkbox" value="yes" />
                    Good Neighbor Policy acknowledged
                  </label>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden p-0" id="images">
              <SectionIntro title="Profile images">
                Optional images for public search cards and profile pages.
              </SectionIntro>
              <div className="grid gap-3 p-5">
                <label className={labelClassName()}>
                  Upload images
                  <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
                    <input
                      accept="image/*"
                      className="block w-full text-sm font-medium text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                      multiple
                      name="images"
                      type="file"
                    />
                  </div>
                </label>
                <p className="text-xs leading-5 text-muted-foreground">
                  Images are uploaded after the listing is created. Use image files up to 10 MB each.
                </p>
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
