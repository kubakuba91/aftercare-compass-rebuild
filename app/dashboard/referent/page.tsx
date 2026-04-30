import { Heart, MessageSquare, Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ReferentDashboardPage() {
  return (
    <main className="shell py-8">
      <Badge tone="warning">Referent workspace</Badge>
      <h1 className="mt-3 text-3xl font-semibold">Referral activity</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Active referrals", "0"],
          ["This month", "0"],
          ["Favorites", "0"],
          ["Unread messages", "0"]
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <Search className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Search</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Find privacy-safe provider profiles by city, state, zip, availability, and program fit.
          </p>
        </Card>
        <Card>
          <Send className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Referrals</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Submit de-identified referrals and track lifecycle status where plan-gated.
          </p>
        </Card>
        <Card>
          <Heart className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Favorites</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Keep a working shortlist of aftercare providers.
          </p>
        </Card>
        <Card>
          <MessageSquare className="text-primary" size={24} />
          <h2 className="mt-3 font-semibold">Messaging</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Professional and Enterprise referent plans can message inside referral threads.
          </p>
        </Card>
      </div>
    </main>
  );
}
