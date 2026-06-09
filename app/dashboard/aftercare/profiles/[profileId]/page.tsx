import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Building2, CheckCircle2, CircleAlert, Eye, ImagePlus, Save, ShieldCheck, Star, Trash2 } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PopulationBedFields } from "@/components/dashboard/population-bed-fields";
import { ProfileEditorTabs } from "@/components/dashboard/profile-editor-tabs";
import { ProfileImageUploader } from "@/components/dashboard/profile-image-uploader";
import { MultiSelectDropdown } from "@/components/onboarding/multi-select-dropdown";
import { getAftercareProfileReadiness } from "@/lib/aftercare-profile-readiness";
import { getActiveProfileOptionValues, mergeOptionValues } from "@/lib/profile-options";
import {
  bedTypeOptions,
  drugTestingPolicyOptions,
  medicationAdministrationOptions,
  preferredContactOptions,
  roomTypeOptions
} from "@/lib/sober-living-onboarding";
import {
  telehealthModeOptions
} from "@/lib/continued-care-onboarding";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { richTextHtml } from "@/lib/rich-text";
import { prisma } from "@/lib/prisma";
import { formatPhotoLimit, getAftercarePhotoLimit } from "@/lib/feature-gates";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";
import {
  updateAftercareProfileDetails,
  updateAftercareProfileStatus,
  uploadAftercareProfileImages,
  removeAftercareProfileImage,
  setAftercareProfileCoverImage,
  addAssociatedContinuedCareProgram,
  removeAssociatedContinuedCareProgram
} from "./actions";

const editSections = [
  { id: "basics", label: "Basics" },
  { id: "availability", label: "Availability" },
  { id: "content", label: "Content" },
  { id: "images", label: "Images" },
  { id: "associated-care", label: "Associated Care", soberLivingOnly: true }
];

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

function textValue(value: string | null | undefined) {
  return value ?? "";
}

function moneyValue(value: string | number | null | undefined) {
  const text = String(value ?? "").replace(/^\s*\$\s*/, "").trim();
  const match = text.match(/^\d+/);
  return match?.[0] ?? "";
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

function ReadinessChecklist({
  checks
}: {
  checks: Array<{ label: string; complete: boolean; required: boolean; message: string }>;
}) {
  return (
    <div className="grid gap-2">
      {checks.map((check) => {
        const Icon = check.complete ? CheckCircle2 : CircleAlert;
        return (
          <div
            key={check.label}
            className="ac-panel-card flex items-start gap-2 p-3 text-sm"
          >
            <Icon
              className={check.complete ? "mt-0.5 shrink-0 text-primary" : "mt-0.5 shrink-0 text-accent"}
              size={16}
            />
            <div>
              <p className="font-semibold">
                {check.label}
                {!check.required ? <span className="ml-2 font-normal text-muted-foreground">Recommended</span> : null}
              </p>
              {!check.complete ? (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{check.message}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function AftercareProfileDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const appUser = await getAftercareDashboardUser("/dashboard/aftercare");
  await redirectIncompleteAftercareOnboarding(appUser.orgId);

  const [{ profileId }, query] = await Promise.all([params, searchParams]);
  const profile = await prisma.aftercareProfile.findFirst({
    where: {
      id: profileId,
      orgId: appUser.orgId ?? undefined
    },
    include: {
      leads: { select: { id: true }, take: 1 },
      referrals: { select: { id: true }, take: 1 },
      certifications: { select: { id: true, status: true } },
      organization: {
        select: {
          subscriptionPlan: true
        }
      },
      continuedCareAssociations: {
        orderBy: { createdAt: "asc" },
        include: {
          continuedCareProfile: {
            select: {
              id: true,
              programName: true,
              status: true,
              publicCity: true,
              publicState: true,
              levelsOfCare: true,
              acceptingNewPatients: true
            }
          }
        }
      },
      images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }
    }
  });

  if (!profile) {
    notFound();
  }

  const isSoberLiving = profile.type === "sober_living";
  const readiness = getAftercareProfileReadiness(profile);
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
  const photoLimit = getAftercarePhotoLimit(profile.organization.subscriptionPlan);
  const photoLimitCopy =
    photoLimit === "unlimited"
      ? "Upload unlimited profile images on your current plan. The cover image appears on search cards and at the top of the public profile."
      : `Upload up to ${photoLimit} images on your current plan. The cover image appears on search cards and at the top of the public profile.`;
  const associatedContinuedCareIds = new Set(
    profile.continuedCareAssociations.map((association) => association.continuedCareProfileId)
  );
  const [profileOptions, continuedCareOptions] = await Promise.all([
    getActiveProfileOptionValues(),
    isSoberLiving
      ? prisma.aftercareProfile.findMany({
          where: {
            orgId: appUser.orgId,
            type: "continued_care",
            id: { notIn: Array.from(associatedContinuedCareIds) }
          },
          orderBy: { programName: "asc" },
          select: {
            id: true,
            programName: true,
            status: true,
            publicCity: true,
            publicState: true
          }
        })
      : Promise.resolve([])
  ]);

  return (
    <main className="shell py-8">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/dashboard/aftercare?tab=homes">
        <ArrowLeft size={16} />
        Back to homes
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={profile.status === "published" ? "success" : "warning"}>{profile.status}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold">{profile.programName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Public location: {publicLocation || "Not set"}
          </p>
        </div>
        <Link
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold"
          href={`/profiles/${profile.slug}?preview=1`}
        >
          <Eye size={16} />
          Preview profile
        </Link>
      </div>

      {query.message ? (
        <div className="mt-5 rounded-md border border-primary/25 bg-primary/10 p-4 text-sm font-semibold text-primary">
          {query.message}
        </div>
      ) : null}

      <div className="mt-5">
        <ProfileEditorTabs sections={editSections.filter((section) => !section.soberLivingOnly || isSoberLiving)} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-5">
          <form action={updateAftercareProfileDetails} className="grid gap-5" id="profile-edit-form">
          <Card className="scroll-mt-24 overflow-hidden p-0" id="basics">
            <SectionIntro title="Program basics">
              Public identity, location, and admissions contact information.
            </SectionIntro>
            <div className="grid gap-4 p-5">
              <input name="profileId" type="hidden" value={profile.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClassName()}>
                  Program name
                  <input className={fieldClassName()} defaultValue={profile.programName} name="programName" required />
                </label>
                <label className={labelClassName()}>
                  Website URL
                  <input className={fieldClassName()} defaultValue={textValue(profile.websiteUrl)} name="websiteUrl" type="url" />
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
                  <input className={fieldClassName()} defaultValue={profile.state} name="state" required />
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
              </div>
            </div>
          </Card>

          <Card className="scroll-mt-24 overflow-hidden p-0" id="availability">
            <SectionIntro title="Availability">
              {isSoberLiving
                ? "Population served, beds, pricing, room types, and availability notes."
                : "Intake status, care levels, program types, and hours."}
            </SectionIntro>
            <div className="grid gap-4 p-5">
              <input name="profileId" type="hidden" value={profile.id} />
              {isSoberLiving ? (
                <>
                  <CheckboxGroup
                    label="Population served"
                    name="populationServedOptions"
                    options={mergeOptionValues(profileOptions.populationServed, selectedPopulation(profile.populationServedOptions, profile.populationServed))}
                    selected={selectedPopulation(profile.populationServedOptions, profile.populationServed)}
                  />
                  <PopulationBedFields
                    initialPopulations={selectedPopulation(profile.populationServedOptions, profile.populationServed)}
                    values={{
                      bedsLgbtq: profile.bedsLgbtq,
                      bedsLgbtqAvailable: profile.bedsLgbtqAvailable,
                      bedsMen: profile.bedsMen,
                      bedsMenAvailable: profile.bedsMenAvailable,
                      bedsWomen: profile.bedsWomen,
                      bedsWomenAvailable: profile.bedsWomenAvailable
                    }}
                  />
                  <CheckboxGroup label="Room types" name="roomTypes" options={roomTypeOptions} selected={profile.roomTypes} />
                  <CheckboxGroup label="Bed types" name="bedTypes" options={bedTypeOptions} selected={profile.bedTypes} />
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={labelClassName()}>
                      Wheelchair accessible bed count
                      <input className={fieldClassName()} defaultValue={profile.wheelchairAccessibleBeds ?? ""} min="0" name="wheelchairAccessibleBeds" type="number" />
                    </label>
                  </div>
                  <label className={labelClassName()}>
                    Reserved beds notes
                    <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.bedsReservedNotes)} name="bedsReservedNotes" />
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
                  <CheckboxGroup label="Program types" name="programTypes" options={mergeOptionValues(profileOptions.programTypes, profile.programTypes)} selected={profile.programTypes} />
                  <CheckboxGroup label="Levels of care" name="levelsOfCare" options={mergeOptionValues(profileOptions.levelsOfCare, profile.levelsOfCare)} selected={profile.levelsOfCare} />
                  <label className={labelClassName()}>
                    Hours of operation
                    <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.hoursOfOperation)} name="hoursOfOperation" />
                  </label>
                </>
              )}
              <label className={labelClassName()}>
                Availability notes
                <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.availabilityNotes)} name="availabilityNotes" />
              </label>
            </div>
          </Card>

          <Card className="scroll-mt-24 overflow-hidden p-0" id="content">
            <SectionIntro title="Profile content">
              Story, services, fit, payment, clinical details, and public-facing notes.
            </SectionIntro>
            <div className="grid gap-5 p-5">
              <input name="profileId" type="hidden" value={profile.id} />
              <label className={labelClassName()}>
                Description
                <RichTextEditor initialValue={richTextHtml(profile.description)} name="description" required />
              </label>
              <label className={labelClassName()}>
                House rules
                <RichTextEditor initialValue={richTextHtml(profile.houseRulesText)} name="houseRulesText" />
              </label>
              <label className={labelClassName()}>
                Referral fit notes
                <textarea className="min-h-44 rounded-md border border-border bg-white p-3 text-sm leading-6" defaultValue={textValue(profile.referralFitNotes)} name="referralFitNotes" />
              </label>
              {!isSoberLiving ? (
                <label className={labelClassName()}>
                  Referral process
                  <textarea className="min-h-44 rounded-md border border-border bg-white p-3 text-sm leading-6" defaultValue={textValue(profile.referralProcessDescription)} name="referralProcessDescription" />
                </label>
              ) : null}
              {!isSoberLiving ? (
                <CheckboxGroup
                  label="Population served"
                  name="populationServedOptions"
                  options={mergeOptionValues(profileOptions.populationServed, profile.populationServedOptions)}
                  selected={profile.populationServedOptions}
                />
              ) : null}
              <CheckboxGroup label="Specialty populations" name="specialtyPopulations" options={mergeOptionValues(profileOptions.specialtyPopulations, profile.specialtyPopulations)} selected={profile.specialtyPopulations} />
              <CheckboxGroup label="Certifications held" name="certificationsHeld" options={mergeOptionValues(profileOptions.certificationsHeld, profile.certificationsHeld)} selected={profile.certificationsHeld} />
              <CheckboxGroup label="Accreditations" name="accreditations" options={mergeOptionValues(profileOptions.accreditations, profile.accreditations)} selected={profile.accreditations} />
              <CheckboxGroup label="Clinical focus" name="clinicalFocus" options={mergeOptionValues(profileOptions.clinicalFocus, profile.clinicalFocus)} selected={profile.clinicalFocus} />
              <CheckboxGroup label="Support services" name="supportServices" options={mergeOptionValues(profileOptions.supportServices, profile.supportServices)} selected={profile.supportServices} />
              {isSoberLiving ? (
                <CheckboxGroup label="Amenities" name="amenities" options={mergeOptionValues(profileOptions.amenities, profile.amenities)} selected={profile.amenities} />
              ) : null}
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
                <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.fundingNotes)} name="fundingNotes" />
              </label>
              <CheckboxGroup label="MAT accepted" name="matAccepted" options={mergeOptionValues(profileOptions.matAccepted, profile.matAccepted)} selected={profile.matAccepted} />
              <label className={labelClassName()}>
                Medication administration
                <select className={fieldClassName()} defaultValue={textValue(profile.medicationAdministration)} name="medicationAdministration">
                  <option value="">Not set</option>
                  {medicationAdministrationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className={labelClassName()}>
                Medication restrictions
                <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.medicationRestrictions)} name="medicationRestrictions" />
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
              {isSoberLiving ? (
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

          <Card className="scroll-mt-24 overflow-hidden p-0" id="images">
            <SectionIntro title="Profile images">
              {photoLimitCopy}
            </SectionIntro>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <ImagePlus className="mt-1 text-primary" size={24} />
                <div>
                  <span className="mt-2 block text-xs font-semibold text-muted-foreground">
                    Current plan includes {formatPhotoLimit(photoLimit)}.
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <p className="text-sm font-medium">Video URLs</p>
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    className={fieldClassName()}
                    defaultValue={profile.videoUrls[index] ?? ""}
                    form="profile-edit-form"
                    name="videoUrls"
                    placeholder="https://..."
                    type="url"
                  />
                ))}
              </div>

              <form action={uploadAftercareProfileImages} className="mt-5 grid gap-3 rounded-md border border-dashed border-border bg-muted/30 p-4">
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
                          <form action={setAftercareProfileCoverImage}>
                            <input name="profileId" type="hidden" value={profile.id} />
                            <input name="imageId" type="hidden" value={image.id} />
                            <button className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold">
                              <Star size={15} />
                              Make cover
                            </button>
                          </form>
                        ) : null}
                        <form action={removeAftercareProfileImage}>
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

          {isSoberLiving ? (
            <Card className="scroll-mt-24 overflow-hidden p-0" id="associated-care">
              <SectionIntro title="Associated continued care">
                Link continued care programs from your organization that residents commonly step into or coordinate with.
              </SectionIntro>

              <div className="p-5">
                {profile.continuedCareAssociations.length ? (
                  <div className="grid gap-3">
                    {profile.continuedCareAssociations.map((association) => (
                      <div
                        key={association.id}
                        className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold">{association.continuedCareProfile.programName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[association.continuedCareProfile.publicCity, association.continuedCareProfile.publicState]
                              .filter(Boolean)
                              .join(", ") || "Location not listed"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge>{association.continuedCareProfile.status}</Badge>
                            {association.continuedCareProfile.acceptingNewPatients ? (
                              <Badge tone="success">Accepting patients</Badge>
                            ) : null}
                          </div>
                        </div>
                        <form action={removeAssociatedContinuedCareProgram}>
                          <input name="profileId" type="hidden" value={profile.id} />
                          <input name="associationId" type="hidden" value={association.id} />
                          <ConfirmSubmitButton
                            className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-destructive"
                            message="Remove this associated continued care program?"
                          >
                            <Trash2 size={15} />
                            Remove
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ac-panel-card p-4 text-sm text-muted-foreground">
                    No continued care programs linked yet.
                  </div>
                )}

              <form action={addAssociatedContinuedCareProgram} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <input name="profileId" type="hidden" value={profile.id} />
                <select
                  className={fieldClassName()}
                  disabled={!continuedCareOptions.length}
                  name="continuedCareProfileId"
                  required
                >
                  <option value="">
                    {continuedCareOptions.length ? "Choose a continued care program" : "No continued care programs available"}
                  </option>
                  {continuedCareOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.programName}
                      {[option.publicCity, option.publicState].filter(Boolean).length
                        ? ` - ${[option.publicCity, option.publicState].filter(Boolean).join(", ")}`
                        : ""}
                    </option>
                  ))}
                </select>
                <button
                  className="focus-ring min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!continuedCareOptions.length}
                >
                  Add program
                </button>
              </form>
              </div>
            </Card>
          ) : null}
        </section>

        <aside className="grid h-fit gap-4 lg:sticky lg:top-6">
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            form="profile-edit-form"
          >
            <Save size={16} />
            Save changes
          </button>

          <Card className="scroll-mt-24" id="publish">
            <ShieldCheck className="text-primary" size={24} />
            <h2 className="mt-3 font-semibold">Publish readiness</h2>
            <p className="mt-2 text-sm text-muted-foreground">{readiness.percent}% complete</p>
            <div className="mt-4 grid gap-4">
              <ReadinessChecklist checks={readiness.checks} />
              {readiness.canPublish ? (
                <p className="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm font-semibold text-primary">
                  This profile is ready to publish.
                </p>
              ) : null}
            </div>
            <form action={updateAftercareProfileStatus} className="mt-5 grid gap-3">
              <input name="profileId" type="hidden" value={profile.id} />
              <button
                className="focus-ring min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!readiness.canPublish}
                name="status"
                value="published"
              >
                {profile.status === "published" ? "Republish profile" : "Publish profile"}
              </button>
              {profile.status === "published" ? (
                <ConfirmSubmitButton
                  className="focus-ring min-h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold"
                  message="Unpublish this profile? It will be removed from marketplace search and public profile pages, but the profile data will be preserved."
                  name="status"
                  value="unpublished"
                >
                  Unpublish profile
                </ConfirmSubmitButton>
              ) : null}
              {profile.status === "unpublished" ? (
                <button
                  className="focus-ring min-h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold"
                  name="status"
                  value="draft"
                >
                  Restore as draft
                </button>
              ) : null}
            </form>
          </Card>

          <Card>
            <h2 className="font-semibold">Activity</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Leads</dt>
                <dd className="font-semibold">{profile.leads.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Referrals</dt>
                <dd className="font-semibold">{profile.referrals.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Documents</dt>
                <dd className="font-semibold">{profile.certifications.length}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </main>
  );
}
