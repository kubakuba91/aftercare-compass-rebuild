import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Building2, CheckCircle2, CircleAlert, Eye, Save, ShieldCheck } from "lucide-react";
import { getAftercareProfileReadiness } from "@/lib/aftercare-profile-readiness";
import {
  amenityOptions,
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  getAftercareDashboardUser,
  redirectIncompleteAftercareOnboarding
} from "@/lib/protected-routing";
import {
  updateAftercareProfileAvailability,
  updateAftercareProfileBasics,
  updateAftercareProfileContent,
  updateAftercareProfileStatus
} from "./actions";

const photoReadinessOptions = [
  "Exterior photo ready",
  "Bedroom photo ready",
  "Shared space photo ready",
  "Kitchen photo ready",
  "Team or program photo ready"
];

function fieldClassName() {
  return "min-h-11 rounded-md border border-border bg-white px-3 text-sm";
}

function labelClassName() {
  return "grid gap-2 text-sm font-medium";
}

function textValue(value: string | null | undefined) {
  return value ?? "";
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
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm"
          >
            <input defaultChecked={selected.includes(option)} name={name} type="checkbox" value={option} />
            {option}
          </label>
        ))}
      </div>
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
            className="flex items-start gap-2 rounded-md border border-border bg-white p-3 text-sm"
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
      certifications: { select: { id: true, status: true } }
    }
  });

  if (!profile) {
    notFound();
  }

  const isSoberLiving = profile.type === "sober_living";
  const readiness = getAftercareProfileReadiness(profile);
  const publicLocation = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");

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
            <Badge>{isSoberLiving ? "Sober Living" : "Continued Care"}</Badge>
            <Badge tone="verified">Tier {profile.verificationTier}</Badge>
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-5">
          <Card>
            <h2 className="text-xl font-semibold">Program basics</h2>
            <form action={updateAftercareProfileBasics} className="mt-5 grid gap-4">
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
              <button className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground md:w-fit">
                <Save size={16} />
                Save basics
              </button>
            </form>
          </Card>

          <Card>
            {isSoberLiving ? <BedDouble className="text-primary" size={24} /> : <Building2 className="text-primary" size={24} />}
            <h2 className="mt-3 text-xl font-semibold">Availability</h2>
            <form action={updateAftercareProfileAvailability} className="mt-5 grid gap-4">
              <input name="profileId" type="hidden" value={profile.id} />
              {isSoberLiving ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ["Men", "bedsMen", "bedsMenAvailable", profile.bedsMen, profile.bedsMenAvailable],
                      ["Women", "bedsWomen", "bedsWomenAvailable", profile.bedsWomen, profile.bedsWomenAvailable],
                      ["LGBTQ+", "bedsLgbtq", "bedsLgbtqAvailable", profile.bedsLgbtq, profile.bedsLgbtqAvailable]
                    ].map(([label, totalName, availableName, total, available]) => (
                      <div key={String(totalName)} className="rounded-md border border-border bg-muted/30 p-3">
                        <p className="font-semibold">{label}</p>
                        <div className="mt-3 grid gap-3">
                          <label className={labelClassName()}>
                            Total beds
                            <input className={fieldClassName()} defaultValue={Number(total ?? 0)} min="0" name={String(totalName)} type="number" />
                          </label>
                          <label className={labelClassName()}>
                            Available beds
                            <input className={fieldClassName()} defaultValue={Number(available ?? 0)} min="0" name={String(availableName)} type="number" />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <CheckboxGroup label="Room types" name="roomTypes" options={roomTypeOptions} selected={profile.roomTypes} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={labelClassName()}>
                      Price per week
                      <input className={fieldClassName()} defaultValue={profile.pricePerWeek ?? ""} min="0" name="pricePerWeek" type="number" />
                    </label>
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
                      Telehealth mode
                      <select className={fieldClassName()} defaultValue={textValue(profile.telehealthMode)} name="telehealthMode">
                        <option value="">Select one</option>
                        {telehealthModeOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <CheckboxGroup label="Program types" name="programTypes" options={programTypeOptions} selected={profile.programTypes} />
                  <CheckboxGroup label="Levels of care" name="levelsOfCare" options={levelOfCareOptions} selected={profile.levelsOfCare} />
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
              <button className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground md:w-fit">
                <Save size={16} />
                Save availability
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Profile content</h2>
            <form action={updateAftercareProfileContent} className="mt-5 grid gap-5">
              <input name="profileId" type="hidden" value={profile.id} />
              <label className={labelClassName()}>
                Description
                <textarea className="min-h-32 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.description)} name="description" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClassName()}>
                  House rules
                  <textarea className="min-h-28 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.houseRulesText)} name="houseRulesText" />
                </label>
                <label className={labelClassName()}>
                  Referral fit notes
                  <textarea className="min-h-28 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.referralFitNotes)} name="referralFitNotes" />
                </label>
              </div>
              {!isSoberLiving ? (
                <label className={labelClassName()}>
                  Referral process
                  <textarea className="min-h-28 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.referralProcessDescription)} name="referralProcessDescription" />
                </label>
              ) : null}
              <CheckboxGroup label="Population served" name="populationServedOptions" options={populationOptions} selected={profile.populationServedOptions} />
              <CheckboxGroup label="Specialty populations" name="specialtyPopulations" options={specialtyPopulationOptions} selected={profile.specialtyPopulations} />
              <CheckboxGroup label="Certifications held" name="certificationsHeld" options={certificationOptions} selected={profile.certificationsHeld} />
              <CheckboxGroup label="Support services" name="supportServices" options={supportServiceOptions} selected={profile.supportServices} />
              {isSoberLiving ? (
                <CheckboxGroup label="Amenities" name="amenities" options={amenityOptions} selected={profile.amenities} />
              ) : null}
              <CheckboxGroup label="Insurance/payment accepted" name="insuranceAccepted" options={insuranceOptions} selected={profile.insuranceAccepted} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClassName()}>
                  Funding available
                  <select className={fieldClassName()} defaultValue={profile.fundingAvailable === null ? "" : profile.fundingAvailable ? "yes" : "no"} name="fundingAvailable">
                    <option value="">Not set</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className={labelClassName()}>
                  Medication administration
                  <select className={fieldClassName()} defaultValue={textValue(profile.medicationAdministration)} name="medicationAdministration">
                    <option value="">Not set</option>
                    {medicationAdministrationOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={labelClassName()}>
                Funding notes
                <textarea className="min-h-24 rounded-md border border-border bg-white p-3 text-sm" defaultValue={textValue(profile.fundingNotes)} name="fundingNotes" />
              </label>
              <CheckboxGroup label="MAT accepted" name="matAccepted" options={matOptions} selected={profile.matAccepted} />
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
              <CheckboxGroup label="Photo readiness" name="photoReadiness" options={photoReadinessOptions} selected={profile.photoReadiness} />
              <div className="grid gap-3">
                <p className="text-sm font-medium">Video URLs</p>
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    className={fieldClassName()}
                    defaultValue={profile.videoUrls[index] ?? ""}
                    name="videoUrls"
                    placeholder="https://..."
                    type="url"
                  />
                ))}
              </div>
              {isSoberLiving ? (
                <label className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <input
                    defaultChecked={profile.goodNeighborPolicyAcknowledged}
                    name="goodNeighborPolicyAcknowledged"
                    type="checkbox"
                    value="yes"
                  />
                  Good Neighbor Policy acknowledged
                </label>
              ) : null}
              <button className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground md:w-fit">
                <Save size={16} />
                Save content
              </button>
            </form>
          </Card>
        </section>

        <aside className="grid h-fit gap-4">
          <Card>
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
                <button
                  className="focus-ring min-h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold"
                  name="status"
                  value="draft"
                >
                  Unpublish profile
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
