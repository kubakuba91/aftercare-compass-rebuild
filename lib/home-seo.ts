import type { Metadata } from "next";
import { publicSeoOrigin, publicSeoUrl, serializeJsonLd } from "@/lib/profile-seo";

export const homeTitle = "Aftercare Compass | Find sober living and continued care availability";

export const homeDescription =
  "Aftercare Compass is a referral platform where case managers and discharge planners search sober living and continued care programs and see the availability those programs have posted.";

/** Visible FAQ copy. The JSON-LD FAQ uses these same strings. */
export const homeFaqs = [
  {
    question: "What is Aftercare Compass?",
    answer:
      "Aftercare Compass is a referral platform for the step after treatment. Case managers, social workers, and discharge planners search published sober living and continued care programs and see the availability those programs have posted. Aftercare Compass is a directory and referral tool. It is not a treatment provider, a crisis line, or a promise that a specific bed is open."
  },
  {
    question: "Who should use Aftercare Compass?",
    answer:
      "Use it when a social worker, case manager, or discharge planner needs to place someone in sober living or continued care, or when a recovery house or continued care program wants referrers to find its published listing. For a medical emergency, call 911. For a mental health or suicide crisis, call or text 988."
  },
  {
    question: "What kinds of programs are listed?",
    answer:
      "Search covers two published program types: sober living, also called recovery housing, and continued care such as intensive outpatient, partial hospitalization, outpatient, and medication-assisted treatment when a program has listed those services."
  },
  {
    question: "Does Aftercare Compass show current bed availability?",
    answer:
      "Programs publish their own availability. A listing can show how many beds the program last reported, or it can say to call the program. Confirm space with the program before you rely on it. Aftercare Compass does not hold beds."
  },
  {
    question: "How do referrals work?",
    answer:
      "A signed-in referrer can send a de-identified referral to a published program and follow its status. The program reviews that referral in its own dashboard. Searching the public directory does not require sending a referral."
  },
  {
    question: "How do I search for a program?",
    answer:
      "On the Aftercare Compass home page, choose Sober Living or Continued Care, then search by city, state, or program name. Results open at aftercarecompass.com/search."
  }
] as const;

export function homeMetadata(): Metadata {
  const canonical = publicSeoUrl("/");
  const image = "/images/aftercare-community-hero.webp";
  return {
    title: { absolute: homeTitle },
    description: homeDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "Aftercare Compass",
      url: canonical,
      title: homeTitle,
      description: homeDescription,
      images: [{ url: image, alt: "People gathered in a recovery community" }]
    },
    twitter: { card: "summary_large_image", title: homeTitle, description: homeDescription, images: [image] },
    robots: { index: true, follow: true }
  };
}

export function homeStructuredData() {
  const origin = publicSeoOrigin();
  const canonical = publicSeoUrl("/");
  const organizationId = `${origin}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Aftercare Compass",
        legalName: "Aftercare Compass LLC",
        url: origin,
        logo: publicSeoUrl("/brand/logo-aftercare.png"),
        email: "contact@aftercarecompass.com",
        description: homeDescription
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "Aftercare Compass",
        url: origin,
        description: homeDescription,
        publisher: { "@id": organizationId },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${publicSeoUrl("/search")}?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        url: canonical,
        isPartOf: { "@id": `${origin}/#website` },
        mainEntity: homeFaqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer }
        }))
      }
    ]
  };
}

export function homeJsonLd() {
  return serializeJsonLd(homeStructuredData());
}
