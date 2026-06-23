import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { ProfileStatus, ProfileType, Role } from "@prisma/client";
import { PopulationBedFields } from "@/components/dashboard/population-bed-fields";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  bedTypeOptions,
  drugTestingPolicyOptions,
  intakeTurnaroundTimeOptions,
  medicationAdministrationOptions,
  preferredContactOptions,
  recoveryResidenceLevelOptions,
  recoverySupportServiceOptions,
  roomTypeOptions
} from "@/lib/sober-living-onboarding";
import {
  clientAcceptanceMethodOptions,
  languageServedOptions,
  medicationServiceOptions,
  programmingScheduleOptions,
  telehealthModeOptions
} from "@/lib/continued-care-onboarding";
import { getActiveProfileOptionValues } from "@/lib/profile-options";
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

  const [soberLivingOptions, continuedCareOptions] = await Promise.all([
    getActiveProfileOptionValues(ProfileType.sober_living),
    getActiveProfileOptionValues(ProfileType.continued_care)
  ]);

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
          <h1 className="mt-4 text-3xl font-semibold">Add listing</h1>
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
                    <span className="admin-profile-type-section admin-profile-type-section--sober-living">Residence name</span>
                    <span className="admin-profile-type-section admin-profile-type-section--continued-care">Program name</span>
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
                  <label className={`admin-profile-type-section admin-profile-type-section--sober-living ${labelClassName()}`}>
                    Intake turnaround time
                    <select className={fieldClassName()} name="intakeTurnaroundTime">
                      <option value="">Select one</option>
                      {intakeTurnaroundTimeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={`admin-profile-type-section admin-profile-type-section--continued-care ${labelClassName()}`}>
                    Intake contact name
                    <input className={fieldClassName()} name="intakeContactName" />
                  </label>
                  <label className={`admin-profile-type-section admin-profile-type-section--continued-care ${labelClassName()}`}>
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
                    Intake phone
                    <input className={fieldClassName()} name="admissionsContactPhone" />
                  </label>
                  <label className={labelClassName()}>
                    Intake email
                    <input className={fieldClassName()} name="admissionsContactEmail" type="email" />
                  </label>
                  <label className={labelClassName()}>
                    Website URL
                    <input className={fieldClassName()} name="websiteUrl" placeholder="https://example.com" type="url" />
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
                    <CheckboxGroup label="Population served" name="populationServedOptions" options={soberLivingOptions.populationServed} />
                  <PopulationBedFields
                    initialPopulations={[]}
                    populationOptions={soberLivingOptions.populationServed}
                    values={{
                    bedsLgbtq: 0,
                    bedsLgbtqAvailable: 0,
                    bedsMen: 0,
                    bedsMenAvailable: 0,
                    bedsWomen: 0,
                    bedsWomenAvailable: 0,
                    totalBeds: 0,
                    bedsAvailable: 0
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
                      Delivery Model
                      <select className={fieldClassName()} name="telehealthMode">
                        <option value="">Select one</option>
                        {telehealthModeOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <CheckboxGroup label="Levels of care" name="levelsOfCare" options={continuedCareOptions.levelsOfCare} />
                    <CheckboxGroup label="When do you offer programming?" name="programmingSchedule" options={programmingScheduleOptions} />
                    <CheckboxGroup label="Languages served" name="languagesServed" options={languageServedOptions} />
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
                <label className={`admin-profile-type-section admin-profile-type-section--sober-living ${labelClassName()}`}>
                  House rules
                  <textarea className={textareaClassName("lg")} name="houseRulesText" />
                </label>
                <label className={`admin-profile-type-section admin-profile-type-section--sober-living ${labelClassName()}`}>
                  Referral fit notes
                  <textarea className={textareaClassName("lg")} name="referralFitNotes" />
                </label>
                <div className="admin-profile-type-section admin-profile-type-section--continued-care">
                  <CheckboxGroup label="How do you accept clients?" name="clientAcceptanceMethods" options={clientAcceptanceMethodOptions} />
                  <CheckboxGroup label="Gender served" name="populationServedOptions" options={continuedCareOptions.populationServed} />
                  <label className={labelClassName()}>
                    Referral process
                    <textarea className={textareaClassName("lg")} name="referralProcessDescription" />
                  </label>
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--sober-living grid gap-5">
                  <CheckboxGroup label="Specialty populations" name="specialtyPopulations" options={soberLivingOptions.specialtyPopulations} />
                  <label className={labelClassName()}>
                    Recovery Residence Level (NARR)
                    <select className={fieldClassName()} name="recoveryResidenceLevel">
                      <option value="">Select one</option>
                      {recoveryResidenceLevelOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <CheckboxGroup label="Certifications held" name="certificationsHeld" options={soberLivingOptions.certificationsHeld} />
                  <CheckboxGroup label="Recovery Support Services" name="recoverySupportServices" options={recoverySupportServiceOptions} />
                  <CheckboxGroup label="Support services" name="supportServices" options={soberLivingOptions.supportServices} />
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--continued-care grid gap-5">
                  <CheckboxGroup label="Specialty populations" name="specialtyPopulations" options={continuedCareOptions.specialtyPopulations} />
                  <CheckboxGroup label="Certifications held" name="certificationsHeld" options={continuedCareOptions.certificationsHeld} />
                  <CheckboxGroup label="Accreditations" name="accreditations" options={continuedCareOptions.accreditations} />
                  <CheckboxGroup label="Clinical focus" name="clinicalFocus" options={continuedCareOptions.clinicalFocus} />
                  <CheckboxGroup label="Support services" name="supportServices" options={continuedCareOptions.supportServices} />
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--sober-living">
                  <CheckboxGroup label="Amenities" name="amenities" options={soberLivingOptions.amenities} />
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--sober-living">
                  <CheckboxGroup label="Insurance/payment accepted" name="insuranceAccepted" options={soberLivingOptions.insuranceAccepted} />
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--continued-care">
                  <CheckboxGroup label="Insurance/payment accepted" name="insuranceAccepted" options={continuedCareOptions.insuranceAccepted} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClassName()}>
                    Scholarship / funding available? (scholarship, state/grant funding, MDRN)
                    <select className={fieldClassName()} name="fundingAvailable">
                      <option value="">Not set</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                <label className={`admin-profile-type-section admin-profile-type-section--sober-living ${labelClassName()}`}>
                  Medication administration
                  <select className={fieldClassName()} name="medicationAdministration">
                    <option value="">Not set</option>
                      {medicationAdministrationOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--continued-care">
                  <CheckboxGroup label="Medication services offered" name="medicationServicesOffered" options={medicationServiceOptions} />
                </div>
                <div className="admin-profile-type-section admin-profile-type-section--continued-care">
                  <CheckboxGroup label="MAT medications offered" name="matAccepted" options={continuedCareOptions.matAccepted} />
                </div>
                <label className={labelClassName()}>
                  Funding notes
                  <textarea className={textareaClassName()} name="fundingNotes" />
                </label>
                <div className="admin-profile-type-section admin-profile-type-section--sober-living">
                  <CheckboxGroup label="MAT accepted" name="matAccepted" options={soberLivingOptions.matAccepted} />
                </div>
                <label className={`admin-profile-type-section admin-profile-type-section--sober-living ${labelClassName()}`}>
                  Medication restrictions
                  <textarea className={textareaClassName()} name="medicationRestrictions" />
                </label>
                <label className={`admin-profile-type-section admin-profile-type-section--sober-living ${labelClassName()}`}>
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
