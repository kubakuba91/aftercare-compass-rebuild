import type { Metadata } from "next";
import { BadgeCheck, BarChart3, Inbox, Radio, Scale, SquarePen } from "lucide-react";
import { AudienceMarketingPage } from "@/components/audience-marketing-page";
import { publicAppUrl } from "@/lib/app-urls";
import { overviewVideoEmbedUrl } from "@/lib/marketing-videos";

export const metadata: Metadata = {
  title: "For Providers | Aftercare Compass",
  description:
    "Fill beds faster, show real-time availability, and reach the care coordinators referring clients daily. Claim your Aftercare Compass listing in five minutes."
};

const benefits = [
  {
    title: "Claimed Provider Profile",
    description: "Control your listing. Update your description, photos, insurance, hours, and program details anytime.",
    icon: SquarePen
  },
  {
    title: "Real-Time Availability",
    description: "Show open beds, slots, or intake windows the moment they’re available. Referents see what’s actually there.",
    icon: Radio
  },
  {
    title: "Verified Badge",
    description: "Complete a simple document review to earn a Verified badge, signal trust, and stand out in search results.",
    icon: BadgeCheck
  },
  {
    title: "Direct Referrals",
    description: "Receive referrals in your platform inbox. Accept, decline, or request more information—all tracked in one place.",
    icon: Inbox
  },
  {
    title: "No Pay-to-Rank",
    description: "The best match wins. We never let providers pay for higher placement.",
    icon: Scale
  },
  {
    title: "Analytics Dashboard",
    description: "See how many people view your listing, request referrals, and connect with your program.",
    icon: BarChart3
  }
];

export default function ForProvidersPage() {
  const claimUrl = publicAppUrl("/search");

  return (
    <AudienceMarketingPage
      audienceLabel="For Providers"
      headline="Fill your beds. Grow your program. Get found by the people who refer."
      subhead="Aftercare Compass connects recovery housing, IOP, PHP, MAT, and outpatient programs with the social workers and case managers actively looking for placements—in real time."
      primaryCta={{ label: "Claim Your Listing", href: claimUrl }}
      video={{
        caption: "See how Aftercare Compass connects your program to referrals",
        eyebrow: "Turn availability into connection.",
        title: "How Aftercare Compass connects providers to referrals",
        url: process.env.NEXT_PUBLIC_PROVIDER_VIDEO_URL?.trim() || overviewVideoEmbedUrl
      }}
      problem={{
        title: "The Problem We Solve for Providers",
        lead: "You have open beds. Social workers have clients ready to move.",
        paragraphs: [
          "But the system between you is broken. Case managers rely on outdated lists, personal relationships, and hours on the phone. Beds stay empty. Clients stay stuck. Everyone loses.",
          "Aftercare Compass gives you a direct line to the people making referrals—with your real-time availability, your program details, and your Verified badge front and center."
        ]
      }}
      benefits={benefits}
      pricing={{
        description: "Simple monthly subscriptions. Multiple tiers fit single-home operators through multi-location networks. No setup fees. Cancel anytime.",
        ctaLabel: "See Current Pricing",
        ctaHref: publicAppUrl("/pricing?audience=providers#providers")
      }}
      steps={[
        { title: "Find your program", description: "Search for your listing. We’ve pre-populated most Pennsylvania providers." },
        { title: "Claim it in 5 minutes", description: "Verify ownership and complete your profile." },
        { title: "Start receiving referrals", description: "Case managers can see and connect with your program immediately." }
      ]}
      testimonialTitle="From Our Providers"
      testimonialPlaceholder="Stories from founding providers will appear here as the network launches and grows."
      closing={{
        title: "Ready to fill your program?",
        description: "Claim your listing today. Founding providers get a Verified badge, a founding provider badge for life, and priority placement in our launch marketing.",
        ctaLabel: "Claim Your Listing",
        ctaHref: claimUrl
      }}
    />
  );
}
