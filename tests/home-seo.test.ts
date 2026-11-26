import assert from "node:assert/strict";
import { test } from "node:test";
import { homeFaqs, homeJsonLd, homeMetadata, homeStructuredData, homeTitle } from "../lib/home-seo";

test("homepage metadata names the product and the search people run", () => {
  const metadata = homeMetadata();
  assert.equal(metadata.title && typeof metadata.title === "object" && "absolute" in metadata.title ? metadata.title.absolute : "", homeTitle);
  assert.match(String(metadata.description), /sober living/i);
  assert.match(String(metadata.description), /continued care/i);
  assert.equal(metadata.alternates && "canonical" in metadata.alternates ? metadata.alternates.canonical : "", "https://www.aftercarecompass.com/");
});

test("homepage schema quotes the visible FAQ and points search at /search", () => {
  const graph = homeStructuredData()["@graph"] as Array<Record<string, unknown>>;
  const faq = graph.find((node) => node["@type"] === "FAQPage");
  const questions = faq?.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;
  assert.deepEqual(
    questions.map((item) => item.name),
    homeFaqs.map((item) => item.question)
  );
  assert.deepEqual(
    questions.map((item) => item.acceptedAnswer.text),
    homeFaqs.map((item) => item.answer)
  );
  const website = graph.find((node) => node["@type"] === "WebSite");
  const action = website?.potentialAction as { target: { urlTemplate: string } };
  assert.equal(action.target.urlTemplate, "https://www.aftercarecompass.com/search?q={search_term_string}");
  const json = homeJsonLd();
  assert.ok(!json.includes("<"));
  assert.ok(!json.toLowerCase().includes("free for referrers"));
});
