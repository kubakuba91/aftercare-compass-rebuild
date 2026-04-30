import { Building2, Hospital, Home } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card } from "@/components/ui/card";

const accountTypes = [
  {
    value: "referent",
    title: "I refer patients",
    description: "Hospitals, inpatient centers, crisis centers, RTCs, and community organizations.",
    icon: Hospital
  },
  {
    value: "sober_living",
    title: "I manage a Sober Living Home",
    description: "Create provider profiles, manage bed availability, and receive referrals.",
    icon: Home
  },
  {
    value: "continued_care",
    title: "I manage a Continued Care Program",
    description: "Publish IOP, PHP, OP, MAT, and dual diagnosis program availability.",
    icon: Building2
  }
];

export const dynamic = "force-dynamic";

export default function AccountTypePage() {
  return (
    <main className="shell py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold">Choose your account type</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Email verification is a hard gate before onboarding continues. Each email belongs to one
            organization only.
          </p>
        </div>
        <SignOutButton />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {accountTypes.map((accountType) => {
          const Icon = accountType.icon;
          return (
            <Card key={accountType.title}>
              <Icon className="text-primary" size={24} />
              <h2 className="mt-4 text-lg font-semibold">{accountType.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{accountType.description}</p>
              <Link
                className="focus-ring mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                href={`/onboarding/start/${accountType.value}`}
              >
                Continue
              </Link>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
