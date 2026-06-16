import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Save, ShieldCheck, Star, Trash2 } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { ProfileStatus, ProfileType, Role } from "@prisma/client";
import { ProfileImageUploader } from "@/components/dashboard/profile-image-uploader";
import { PopulationBedFields } from "@/components/dashboard/population-bed-fields";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  bedTypeOptions,
  drugTestingPolicyOptions,
  medicationAdministrationOptions,
  preferredContactOptions,
  roomTypeOptions
} from "@/lib/sober-living-onboarding";
import {
  clientAcceptanceMethodOptions,
  languageServedOptions,
  medicationServiceOptions,
  programmingScheduleOptions,
  telehealthModeOptions
} from "@/lib/continued-care-onboarding";
import { formatPhotoLimit, getAftercarePhotoLimit } from "@/lib/feature-gates";
import { getActiveProfileOptionValues, mergeOptionValues } from "@/lib/profile-options";
import { getProtectedAppUser } from "@/lib/protected-routing";
import { prisma } from "@/lib/prisma";
import {
  removeAdminProfileImage,
  setAdminProfileCoverImage,
  updateAdminAftercareProfile,
  uploadAdminProfileImages
} from "../../../actions";

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

function textValue(value: string | null | undefined) {
  return value ?? "";
}

function selectedPopulation(values?: string[] | null, legacyValue?: string | null) {
  if (values?.length) {
    return values;
  }

  if (legacyValue === "men") {
    return ["Men"];
  }

  if (legacyValue === "women") {
    return ["Women"];
  }

  if (legacyValue === "lgbtq") {
    return ["LGBTQ+"];
  }

  if (legacyValue === "both") {
    return ["Men", "Women"];
  }

  return [];
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
  options,
  selected
}: {
  label: string;
  name: string;
  options: readonly string[];
  selected: string[];
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <MultiSelectDropdown
        name={name}
        options={options}
        placeholder={`Select ${label.toLowerCase()}...`}
        selected={selected}
      />
    </fieldset>
  );
}

export default async function AdminEditProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [appUser, { profileId }, query] = await Promise.all([
    getProtectedAppUser("/dashboard/admin"),
    params,
    searchParams
  ]);

  if (appUser.role !== Role.system_admin) {
    redirect("/dashboard");
  }

  const profile = await prisma.aftercareProfile.findUnique({
    where: { id: profileId },
    include: {
      organization: {
        select: {
          subscriptionPlan: true
        }
      },
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!profile) {
    redirect("/dashboard/admin?tab=profiles&reviewMessage=Listing%20was%20not%20found.");
  }

  const profileOptions = await getActiveProfileOptionValues(profile.type);

  const photoLimit = getAftercarePhotoLimit(profile.organization.subscriptionPlan);

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

      {query.message ? (
        <div className="mt-5 rounded-md border border-primary/25 bg-primary/10 p-4 text-sm font-semibold text-primary">
          {query.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <section>
          <form action={updateAdminAftercareProfile} className="grid gap-5" encType="multipart/form-data" id="admin-edit-profile-form">
            <input name="profileId" type="hidden" value={profile.id} />
            <Card className="overflow-hidden p-0">
              <SectionIntro title="Program basics">
                Public identity, location, and admissions contact information.
              </SectionIntro>
              <div className="grid gap-4 p-5 md:grid-cols-2">
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
                    Preferred contact method
                    <select className={fieldClassName()} defaultValue={textValue(profile.preferredContactMethod)} name="preferredContactMethod">
                      <option value="">Select one</option>
                      {preferredContactOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClassName()}>
                    Intake contact name
                    <input className={fieldClassName()} defaultValue={textValue(profile.intakeContactName)} name="intakeContactName" />
                  </label>
                  <label className={labelClassName()}>
                    License number
                    <input className={fieldClassName()} defaultValue={textValue(profile.stateLicenseNumber)} name="stateLicenseNumber" />
                  </label>
                  <label className={labelClassName()}>
                    Street address
                    <input className={fieldClassName()} defaultValue={textValue(profile.streetAddress)} name="streetAddress" />
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
                    <input className={fieldClassName()} defaultValue={textValue(profile.zip)} name="zip" />
                  </label>
                  <label className={labelClassName()}>
                    Admissions phone
                    <input className={fieldClassName()} defaultValue={textValue(profile.admissionsContactPhone)} name="admissionsContactPhone" />
                  </label>
                  <label className={labelClassName()}>
                    Admissions email
                    <input className={fieldClassName()} defaultValue={textValue(profile.admissionsContactEmail)} name="admissionsContactEmail" type="email" />
                  </label>
                  <label className={labelClassName()}>
                    Website URL
                    <input className={fieldClassName()} defaultValue={textValue(profile.websiteUrl)} name="websiteUrl" placeholder="https://example.com" type="url" />
                  </label>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <SectionIntro title="Availability">
                Keep the public availability summary current.
              </SectionIntro>
              <div className="grid gap-5 p-5">
                {profile.type === ProfileType.sober_living ? (
                  <>
                    <CheckboxGroup
                      label="Population served"
                      name="populationServedOptions"
                      options={mergeOptionValues(profileOptions.populationServed, selectedPopulation(profile.populationServedOptions, profile.populationServed))}
                      selected={selectedPopulation(profile.populationServedOptions, profile.populationServed)}
                    />
                    <PopulationBedFields
                      initialPopulations={selectedPopulation(profile.populationServedOptions, profile.populationServed)}
                      populationOptions={mergeOptionValues(profileOptions.populationServed, selectedPopulation(profile.populationServedOptions, profile.populationServed))}
                      values={{
                        bedsLgbtq: profile.bedsLgbtq,
                        bedsLgbtqAvailable: profile.bedsLgbtqAvailable,
                        bedsMen: profile.bedsMen,
                        bedsMenAvailable: profile.bedsMenAvailable,
                        bedsWomen: profile.bedsWomen,
                        bedsWomenAvailable: profile.bedsWomenAvailable,
                        totalBeds: profile.totalBeds,
                        bedsAvailable: profile.bedsAvailable
                      }}
                    />
                    <CheckboxGroup label="Room types" name="roomTypes" options={mergeOptionValues(roomTypeOptions, profile.roomTypes)} selected={profile.roomTypes} />
                    <CheckboxGroup label="Bed types" name="bedTypes" options={mergeOptionValues(bedTypeOptions, profile.bedTypes)} selected={profile.bedTypes} />
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
                    <CheckboxGroup label="Insurance/payment accepted" name="insuranceAccepted" options={mergeOptionValues(profileOptions.insuranceAccepted, profile.insuranceAccepted)} selected={profile.insuranceAccepted} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={labelClassName()}>
                        Funding available
                        <select className={fieldClassName()} defaultValue={profile.fundingAvailable === null ? "" : profile.fundingAvailable ? "yes" : "no"} name="fundingAvailable">
                          <option value="">Not set</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                    </div>
                    <label className={labelClassName()}>
                      Funding notes
                      <textarea className={textareaClassName()} defaultValue={textValue(profile.fundingNotes)} name="fundingNotes" />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={labelClassName()}>
                        Wheelchair accessible bed count
                        <input className={fieldClassName()} defaultValue={profile.wheelchairAccessibleBeds ?? ""} min="0" name="wheelchairAccessibleBeds" type="number" />
                      </label>
                    </div>
                    <label className={labelClassName()}>
                      Reserved beds notes
                      <textarea className={textareaClassName()} defaultValue={textValue(profile.bedsReservedNotes)} name="bedsReservedNotes" />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={labelClassName()}>
                        Accepting new patients
                        <select className={fieldClassName()} defaultValue={profile.acceptingNewPatients ? "yes" : "no"} name="acceptingNewPatients">
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                      <label className={labelClassName()}>
                        Delivery Model
                        <select className={fieldClassName()} defaultValue={textValue(profile.telehealthMode)} name="telehealthMode">
                          <option value="">Select one</option>
                          {telehealthModeOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <CheckboxGroup label="Levels of care" name="levelsOfCare" options={mergeOptionValues(profileOptions.levelsOfCare, profile.levelsOfCare)} selected={profile.levelsOfCare} />
                    <CheckboxGroup
                      label="When do you offer programming?"
                      name="programmingSchedule"
                      options={mergeOptionValues(programmingScheduleOptions, profile.programmingSchedule)}
                      selected={profile.programmingSchedule}
                    />
                    <CheckboxGroup
                      label="Languages served"
                      name="languagesServed"
                      options={mergeOptionValues(languageServedOptions, profile.languagesServed)}
                      selected={profile.languagesServed}
                    />
                    <CheckboxGroup label="Insurance/payment accepted" name="insuranceAccepted" options={mergeOptionValues(profileOptions.insuranceAccepted, profile.insuranceAccepted)} selected={profile.insuranceAccepted} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className={labelClassName()}>
                        Funding available
                        <select className={fieldClassName()} defaultValue={profile.fundingAvailable === null ? "" : profile.fundingAvailable ? "yes" : "no"} name="fundingAvailable">
                          <option value="">Not set</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                    </div>
                    <label className={labelClassName()}>
                      Funding notes
                      <textarea className={textareaClassName()} defaultValue={textValue(profile.fundingNotes)} name="fundingNotes" />
                    </label>
                  </>
                )}
                <label className={labelClassName()}>
                  Availability notes
                  <textarea className={textareaClassName()} defaultValue={textValue(profile.availabilityNotes)} name="availabilityNotes" />
                </label>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <SectionIntro title="Profile content">
                Story, services, fit, payment, clinical details, and public-facing notes.
              </SectionIntro>
              <div className="grid gap-5 p-5">
                <label className={labelClassName()}>
                  Description
                  <textarea className={textareaClassName("lg")} defaultValue={textValue(profile.description)} name="description" />
                </label>
                <label className={labelClassName()}>
                  House rules
                  <textarea className={textareaClassName("lg")} defaultValue={textValue(profile.houseRulesText)} name="houseRulesText" />
                </label>
                <label className={labelClassName()}>
                  Referral fit notes
                  <textarea className={textareaClassName("lg")} defaultValue={textValue(profile.referralFitNotes)} name="referralFitNotes" />
                </label>
                {profile.type === ProfileType.continued_care ? (
                  <>
                    <CheckboxGroup
                      label="How do you accept clients?"
                      name="clientAcceptanceMethods"
                      options={mergeOptionValues(clientAcceptanceMethodOptions, profile.clientAcceptanceMethods)}
                      selected={profile.clientAcceptanceMethods}
                    />
                    <label className={labelClassName()}>
                      Referral process
                      <textarea className={textareaClassName("lg")} defaultValue={textValue(profile.referralProcessDescription)} name="referralProcessDescription" />
                    </label>
                    <CheckboxGroup
                      label="Gender served"
                      name="populationServedOptions"
                      options={mergeOptionValues(profileOptions.populationServed, profile.populationServedOptions)}
                      selected={profile.populationServedOptions}
                    />
                  </>
                ) : null}
                <CheckboxGroup label="Specialty populations" name="specialtyPopulations" options={mergeOptionValues(profileOptions.specialtyPopulations, profile.specialtyPopulations)} selected={profile.specialtyPopulations} />
                <CheckboxGroup label="Certifications held" name="certificationsHeld" options={mergeOptionValues(profileOptions.certificationsHeld, profile.certificationsHeld)} selected={profile.certificationsHeld} />
                <CheckboxGroup label="Accreditations" name="accreditations" options={mergeOptionValues(profileOptions.accreditations, profile.accreditations)} selected={profile.accreditations} />
                <CheckboxGroup label="Clinical focus" name="clinicalFocus" options={mergeOptionValues(profileOptions.clinicalFocus, profile.clinicalFocus)} selected={profile.clinicalFocus} />
                <CheckboxGroup label="Support services" name="supportServices" options={mergeOptionValues(profileOptions.supportServices, profile.supportServices)} selected={profile.supportServices} />
                {profile.type === ProfileType.sober_living ? (
                  <CheckboxGroup label="Amenities" name="amenities" options={mergeOptionValues(profileOptions.amenities, profile.amenities)} selected={profile.amenities} />
                ) : null}
                <label className={labelClassName()}>
                  Medication administration
                  <select className={fieldClassName()} defaultValue={textValue(profile.medicationAdministration)} name="medicationAdministration">
                    <option value="">Not set</option>
                    {medicationAdministrationOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                {profile.type === ProfileType.continued_care ? (
                  <CheckboxGroup
                    label="Medication services offered"
                    name="medicationServicesOffered"
                    options={mergeOptionValues(medicationServiceOptions, profile.medicationServicesOffered)}
                    selected={profile.medicationServicesOffered}
                  />
                ) : null}
                <CheckboxGroup label="MAT medications offered" name="matAccepted" options={mergeOptionValues(profileOptions.matAccepted, profile.matAccepted)} selected={profile.matAccepted} />
                <label className={labelClassName()}>
                  Medication restrictions
                  <textarea className={textareaClassName()} defaultValue={textValue(profile.medicationRestrictions)} name="medicationRestrictions" />
                </label>
                <label className={labelClassName()}>
                  Drug testing policy
                  <select className={fieldClassName()} defaultValue={textValue(profile.drugTestingPolicy)} name="drugTestingPolicy">
                    <option value="">Not set</option>
                    {drugTestingPolicyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                {profile.type === ProfileType.sober_living ? (
                  <label className="ac-panel-card flex items-start gap-3 p-4 text-sm">
                    <input
                      defaultChecked={profile.goodNeighborPolicyAcknowledged}
                      name="goodNeighborPolicyAcknowledged"
                      type="checkbox"
                      value="yes"
                    />
                    Good Neighbor Policy acknowledged
                  </label>
                ) : null}
              </div>
            </Card>

          </form>

          <Card className="overflow-hidden p-0">
            <SectionIntro title="Profile images">
              Upload up to {formatPhotoLimit(photoLimit)}. The cover image appears on search cards and at the top of the public profile.
            </SectionIntro>
            <div className="grid gap-4 p-5">
              <div className="grid gap-3">
                <p className="text-sm font-medium">Video URLs</p>
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    className={fieldClassName()}
                    defaultValue={profile.videoUrls[index] ?? ""}
                    form="admin-edit-profile-form"
                    name="videoUrls"
                    placeholder="https://..."
                    type="url"
                  />
                ))}
              </div>

              <form action={uploadAdminProfileImages} className="grid gap-3 rounded-md border border-dashed border-border bg-muted/30 p-4">
                <input name="profileId" type="hidden" value={profile.id} />
                <ProfileImageUploader currentImageCount={profile.images.length} photoLimit={photoLimit} />
              </form>

              {profile.images.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.images.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-md border border-border bg-white">
                      <div className="relative aspect-[4/3] bg-muted">
                        <Image
                          alt={image.altText || profile.programName}
                          className="object-cover"
                          fill
                          sizes="(min-width: 1024px) 320px, 100vw"
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
                <div className="ac-panel-card p-4 text-sm text-muted-foreground">
                  No images uploaded yet.
                </div>
              )}
            </div>
          </Card>
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

          {profile.status === ProfileStatus.published ? (
            <Card>
              <h2 className="font-semibold">Public preview</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Check how this profile appears before or after saving edits.
              </p>
              <Link className="mt-4 inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold" href={`/profiles/${profile.slug}?preview=1`}>
                View profile
              </Link>
            </Card>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
