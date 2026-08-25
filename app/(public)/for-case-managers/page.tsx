import type { Metadata } from "next";
import { BadgeCheck, BellRing, History, Radio, SearchCheck, Send } from "lucide-react";
import { AudienceMarketingPage } from "@/components/audience-marketing-page";
import { dashboardAppUrl, publicAppUrl } from "@/lib/app-urls";
import { overviewVideoEmbedUrl } from "@/lib/marketing-videos";

export const metadata: Metadata = {
  title: "For Case Managers & Care Coordinators | Aftercare Compass",
  description:
    "Find available recovery housing, IOP, PHP, MAT, and outpatient programs in seconds. Aftercare Compass helps case managers place clients into their next step—without hours on the phone."
};

const benefits = [
  {
    title: "Real-Time Availability",
    description: "See open beds, slots, and intake windows the moment they’re available. No more phone tag.",
    icon: Radio
  },
  {
    title: "Search That Matches Real Life",
    description: "Filter by care level, insurance, location, gender, specialty populations, and more to find the exact fit.",
    icon: SearchCheck
  },
  {
    title: "Direct Referral Submission",
    description: "Send a de-identified referral in seconds and track its status from your dashboard.",
    icon: Send
  },
  {
    title: "Referral History",
    description: "Every referral you’ve sent, saved, and tracked—all in one place.",
    icon: History
  },
  {
    title: "Saved Searches + Bed Alerts",
    description: "Get notified the moment your top-choice program has availability.",
    icon: BellRing
  },
  {
    title: "Verified Providers",
    description: "Programs with a Verified badge have completed our document review, so you know what you’re referring to.",
    icon: BadgeCheck
  }
];

export default function ForCaseManagersPage() {
  const signupUrl = dashboardAppUrl("/sign-up");

  return (
    <AudienceMarketingPage
      audienceLabel="For Case Managers & Care Coordinators"
      headline="Find the right next step for your client—in seconds, not hours."
      subhead="Aftercare Compass is a real-time referral platform for social workers, discharge coordinators, and case managers. Search by level of care, insurance, and location. See what’s actually available. Send referrals in seconds."
      primaryCta={{ label: "Get Started", href: signupUrl }}
      video={{
        caption: "See how Aftercare Compass finds real placements in real time",
        eyebrow: "A warm handoff starts here.",
        title: "How Aftercare Compass helps case managers find placements",
        url: process.env.NEXT_PUBLIC_CASE_MANAGER_VIDEO_URL?.trim() || overviewVideoEmbedUrl
      }}
      problem={{
        title: "The Problem We Solve for Case Managers",
        lead: "You have 25 to 45 clients. Each one deserves a warm handoff to the next step.",
        paragraphs: [
          "But the tools you’re given are stuck in the last decade. Static directories. Outdated phone numbers. Personal relationships you’ve had to build one program at a time. Hours on hold when your client needed you an hour ago.",
          "Aftercare Compass gives you a live view of every provider in your area—what levels of care they offer, what insurance they take, where they are, and whether they have space right now."
        ]
      }}
      benefits={benefits}
      pricing={{
        description: "Plans are built for solo case managers, growing teams, and full health systems. Cancel anytime.",
        ctaLabel: "See Current Pricing",
        ctaHref: publicAppUrl("/pricing?audience=case-managers#case-managers")
      }}
      steps={[
        { title: "Sign up in minutes", description: "Get started without complicated setup." },
        { title: "Search for what your client needs", description: "Match by level of care, insurance, and geography." },
        { title: "Send a referral", description: "The provider gets it instantly, and you see the status update." }
      ]}
      testimonialTitle="From Our Users"
      testimonialPlaceholder="Stories from social workers, case managers, and discharge coordinators will appear here as the network launches."
      closing={{
        title: "Ready to give your clients a warm handoff every time?",
        description: "Join the platform built for the people doing the hard work of connecting recovery to what comes next.",
        ctaLabel: "Get Started",
        ctaHref: signupUrl
      }}
    />
  );
}
