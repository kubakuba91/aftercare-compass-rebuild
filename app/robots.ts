import type { MetadataRoute } from "next";
import { publicSeoUrl } from "@/lib/profile-seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/onboarding", "/auth/", "/sign-in", "/sign-up", "/setup", "/claim-profile/"] },
    sitemap: publicSeoUrl("/sitemap.xml")
  };
}
