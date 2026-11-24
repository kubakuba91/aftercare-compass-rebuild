import type { AftercareProfile } from "@prisma/client";
import type { Metadata } from "next";
import { richTextToPlainText, sanitizeRichText } from "@/lib/rich-text";
import { coverageLabel, isVirtualOnly } from "@/lib/virtual-care";

export type SeoProfile = Pick<AftercareProfile,
  "slug" | "programName" | "type" | "publicCity" | "publicState" |
  "telehealthMode" | "statesServed" | "description" | "levelsOfCare" |
  "admissionsContactPhone"
>;

export function publicSeoOrigin() {
  const configured = process.env.NEXT_PUBLIC_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  try {
    const url = new URL(configured || "https://www.aftercarecompass.com");
    if (url.protocol === "https:" && !["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) return url.origin;
  } catch { /* Use the production public origin when configuration is absent or invalid. */ }
  return "https://www.aftercarecompass.com";
}

export function publicSeoUrl(path = "/") {
  return new URL(path, publicSeoOrigin()).href;
}

export function profileSeo(profile: SeoProfile) {
  const canonical = publicSeoUrl(`/profiles/${encodeURIComponent(profile.slug)}`);
  const virtual = isVirtualOnly(profile);
  const careType = profile.type === "sober_living" ? "Sober Living" : "Continued Care";
  const location = [profile.publicCity, profile.publicState].filter(Boolean).join(", ");
  const place = virtual
    ? `Virtual${profile.statesServed.length ? ` in ${coverageLabel(profile.statesServed)}` : ""}`
    : location ? `in ${location}` : "";
  const title = `${profile.programName} — ${careType}${place ? ` ${place}` : ""} | Aftercare Compass`;
  const summary = richTextToPlainText(sanitizeRichText(profile.description)).replace(/\s+/g, " ").trim();
  const services = profile.levelsOfCare.join(", ");
  const text = `${profile.programName} offers ${careType.toLowerCase()}${place ? ` ${place}` : ""}. ${summary || (services ? `Services include ${services}.` : "Explore program details and contact information on Aftercare Compass.")}`;
  const description = text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, "").trimEnd()}…` : text;
  return { canonical, title, description, careType, virtual };
}

export function profileMetadata(profile: SeoProfile): Metadata {
  const { canonical, title, description } = profileSeo(profile);
  return {
    title, description,
    alternates: { canonical },
    openGraph: { type: "website", siteName: "Aftercare Compass", url: canonical, title, description },
    twitter: { card: "summary", title, description }
  };
}

export function profileStructuredData(profile: SeoProfile) {
  const { canonical, title, description, careType, virtual } = profileSeo(profile);
  const providerId = `${canonical}#provider`;
  const serviceId = `${canonical}#service`;
  const areaServed = virtual
    ? profile.statesServed.map(name => ({ "@type": "AdministrativeArea", name }))
    : [profile.publicCity, profile.publicState].filter(Boolean).map(name => ({ "@type": "Place", name }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": canonical, url: canonical, name: title, description,
        mainEntity: { "@id": serviceId }, breadcrumb: { "@id": `${canonical}#breadcrumbs` } },
      { "@type": "Organization", "@id": providerId, name: profile.programName, url: canonical,
        ...(profile.admissionsContactPhone?.trim() ? { telephone: profile.admissionsContactPhone.trim() } : {}) },
      { "@type": "Service", "@id": serviceId, name: `${profile.programName} — ${careType}`,
        serviceType: careType, description, url: canonical, provider: { "@id": providerId },
        ...(areaServed.length ? { areaServed } : {}) },
      { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumbs`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: publicSeoUrl("/") },
        { "@type": "ListItem", position: 2, name: "Find aftercare", item: publicSeoUrl("/search") },
        { "@type": "ListItem", position: 3, name: profile.programName, item: canonical }
      ] }
    ]
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
