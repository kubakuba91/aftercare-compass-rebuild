import type { MetadataRoute } from "next";
import { publicSeoUrl } from "@/lib/profile-seo";

const privatePaths = ["/api/", "/dashboard", "/onboarding", "/auth/", "/sign-in", "/sign-up", "/setup", "/claim-profile/"];

// Popular answer engines crawl with these agents. They get the same public pages as everyone else.
const answerEngineCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "GrokBot",
  "xAI-Grok",
  "Grok-DeepSearch"
];

export default function robots(): MetadataRoute.Robots {
  const publicRule = { allow: "/", disallow: privatePaths };
  return {
    rules: [{ userAgent: "*", ...publicRule }, ...answerEngineCrawlers.map((userAgent) => ({ userAgent, ...publicRule }))],
    sitemap: publicSeoUrl("/sitemap.xml")
  };
}
