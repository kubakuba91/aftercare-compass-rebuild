import type { AftercareProfile } from "@prisma/client";
import { BadgeCheck, CheckCircle2, HandHeart, PillBottle, Users, House, CreditCard, KeyRound, ClipboardList } from "lucide-react";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { Card } from "@/components/ui/card";

type DetailProfile = Pick<AftercareProfile,
  "type" | "specialtyPopulations" | "supportServices" | "amenities" | "programmingSchedule" |
  "clientAcceptanceMethods" | "languagesServed" | "insuranceAccepted" | "insuranceNotes" |
  "matAccepted" | "medicationServicesOffered" | "recoveryResidenceLevel" | "intakeTurnaroundTime" |
  "certificationsHeld" | "accreditations" | "recoverySupportServices" | "clinicalFocus"
> & Partial<Pick<AftercareProfile, "levelsOfCare" | "populationServedOptions" | "moveInCost" | "drugTestingPolicy">>;

function detailText(value: string[] | string | null) {
  return Array.isArray(value) ? value.map(item => item.trim()).filter(Boolean).join(", ") : value?.trim() || "";
}

export function ProfileDetailSections({ profile }: { profile: DetailProfile }) {
  const home = profile.type === "sober_living";
  const row = (label: string, Icon: typeof Users, value: string[] | string | null, notes?: string | null) => ({
    label, Icon, value: detailText(value), values: Array.isArray(value) ? value.map(item => item.trim()).filter(Boolean) : [], notes: notes?.trim() || ""
  });
  const services = [
    row("Level of care", House, home ? profile.recoveryResidenceLevel : profile.levelsOfCare || []),
    row("Insurance/payment", CreditCard, profile.insuranceAccepted, profile.insuranceNotes),
    row("Populations served", Users, profile.populationServedOptions || []),
    row("Move-in costs", KeyRound, profile.moveInCost || null),
    ...(home ? [row("Drug testing policy", ClipboardList, profile.drugTestingPolicy || null)] : []),
    row("Specialty populations", Users, profile.specialtyPopulations),
    row("Support services", HandHeart, profile.supportServices),
    home ? row("Amenities", CheckCircle2, profile.amenities) : row("Programming schedule", CheckCircle2, profile.programmingSchedule),
    ...(!home ? [
      row("How clients are accepted", HandHeart, profile.clientAcceptanceMethods),
      row("Languages served", Users, profile.languagesServed)
    ] : [])
  ];
  const fit = [

    home ? row("MAT accepted", PillBottle, profile.matAccepted) : row("Medication services", PillBottle, profile.medicationServicesOffered),
    ...(!home && profile.medicationServicesOffered.includes("MAT / Addiction medication management")
      ? [row("MAT medications offered", PillBottle, profile.matAccepted)] : []),
    ...(home ? [

      row("Intake turnaround", CheckCircle2, profile.intakeTurnaroundTime)
    ] : []),
    row("Certifications", BadgeCheck, profile.certificationsHeld),
    ...(!home ? [row("Accreditations", BadgeCheck, profile.accreditations)] : []),
    home ? row("Recovery Support Services", PillBottle, profile.recoverySupportServices) : row("Clinical focus", PillBottle, profile.clinicalFocus)
  ];
  const priority = ["Level of care", "Insurance/payment", "MAT accepted", "Medication services", "MAT medications offered", "Populations served"];
  const rows = [...services, ...fit].filter(item => item.value || item.notes).sort((a, b) => {
    const rank = (label: string) => priority.includes(label) ? priority.indexOf(label) : priority.length;
    return rank(a.label) - rank(b.label);
  });
  if (!rows.length) return null;
  return <Card>
    <h2 className="ac-section-heading">At a glance</h2>
    <SummaryGrid items={rows.map(({ label, Icon, value, values, notes }) => ({
      label, icon: Icon,
      value: values.length ? <ul className="ac-summary-list">{values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : value,
      notes
    }))} />
  </Card>;
}
