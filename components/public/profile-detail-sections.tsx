import type { AftercareProfile } from "@prisma/client";
import { BadgeCheck, CheckCircle2, HandHeart, PillBottle, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

type DetailProfile = Pick<AftercareProfile,
  "type" | "specialtyPopulations" | "supportServices" | "amenities" | "programmingSchedule" |
  "clientAcceptanceMethods" | "languagesServed" | "insuranceAccepted" | "insuranceNotes" |
  "matAccepted" | "medicationServicesOffered" | "recoveryResidenceLevel" | "intakeTurnaroundTime" |
  "certificationsHeld" | "accreditations" | "recoverySupportServices" | "clinicalFocus"
>;

function detailText(value: string[] | string | null) {
  return Array.isArray(value) ? value.map(item => item.trim()).filter(Boolean).join(", ") : value?.trim() || "";
}

export function ProfileDetailSections({ profile }: { profile: DetailProfile }) {
  const home = profile.type === "sober_living";
  const row = (label: string, Icon: typeof Users, value: string[] | string | null, notes?: string | null) => ({
    label, Icon, value: detailText(value), notes: notes?.trim() || ""
  });
  const services = [
    row("Specialty populations", Users, profile.specialtyPopulations),
    row("Support services", HandHeart, profile.supportServices),
    home ? row("Amenities", CheckCircle2, profile.amenities) : row("Programming schedule", CheckCircle2, profile.programmingSchedule),
    ...(!home ? [
      row("How clients are accepted", HandHeart, profile.clientAcceptanceMethods),
      row("Languages served", Users, profile.languagesServed)
    ] : [])
  ];
  const fit = [
    ...(!home ? [row("Insurance/payment", ShieldCheck, profile.insuranceAccepted, profile.insuranceNotes)] : []),
    home ? row("MAT accepted", PillBottle, profile.matAccepted) : row("Medication services", PillBottle, profile.medicationServicesOffered),
    ...(!home && profile.medicationServicesOffered.includes("MAT / Addiction medication management")
      ? [row("MAT medications offered", PillBottle, profile.matAccepted)] : []),
    ...(home ? [
      row("Recovery Residence Level (NARR)", BadgeCheck, profile.recoveryResidenceLevel),
      row("Intake turnaround", CheckCircle2, profile.intakeTurnaroundTime)
    ] : []),
    row("Certifications", BadgeCheck, profile.certificationsHeld),
    ...(!home ? [row("Accreditations", BadgeCheck, profile.accreditations)] : []),
    home ? row("Recovery Support Services", PillBottle, profile.recoverySupportServices) : row("Clinical focus", PillBottle, profile.clinicalFocus)
  ];
  const sections = [
    { title: "Services and amenities", rows: services },
    { title: home ? "Recovery support and fit" : "Payment and clinical fit", rows: fit }
  ].map(section => ({ ...section, rows: section.rows.filter(item => item.value || item.notes) }))
    .filter(section => section.rows.length);

  if (!sections.length) return null;

  return (
    <div className={`grid gap-4${sections.length === 2 ? " md:grid-cols-2" : ""}`}>
      {sections.map(section => (
        <Card key={section.title}>
          <h2 className="font-semibold">{section.title}</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {section.rows.map(({ label, Icon, value, notes }) => (
              <div key={label}>
                <dt className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon aria-hidden="true" className="text-primary" size={16} />
                  {label}
                </dt>
                <dd className="font-medium">
                  {value}
                  {notes ? <p className={`${value ? "mt-2 " : ""}text-sm text-muted-foreground`}>{notes}</p> : null}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
}
