import { BedDouble, ClipboardList, Inbox, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const metrics = [
  ["Profiles", "0"],
  ["Open referrals", "0"],
  ["Public leads", "0"],
  ["Availability updates", "0"]
];

export default function AftercareDashboardPage() {
  return (
    <main className="shell py-8">
      <Badge tone="verified">Aftercare dashboard</Badge>
      <h1 className="mt-3 text-3xl font-semibold">Provider operations</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <Inbox className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Referral inbox</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Receive de-identified referrals, manage status, and send plan-gated messages.
          </p>
        </Card>
        <Card>
          <BedDouble className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Availability</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sober Living manages beds. Continued Care manages accepting-new-patients status.
          </p>
        </Card>
        <Card>
          <ClipboardList className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Documents</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload verification documents to private storage for admin review.
          </p>
        </Card>
        <Card>
          <Users className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Team</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Admins manage team members while enforcing one organization per email.
          </p>
        </Card>
      </div>
    </main>
  );
}

