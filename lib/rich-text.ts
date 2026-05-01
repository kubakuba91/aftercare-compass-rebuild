const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li"]);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function richTextToPlainText(value: string | null | undefined) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeRichText(value: string | null | undefined) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  const withParagraphs = /<\/?[a-z][\s\S]*>/i.test(raw) ? raw : textToHtml(raw);
  const withoutUnsafeBlocks = withParagraphs
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const sanitized = withoutUnsafeBlocks.replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (tag, tagName) => {
    const normalized = String(tagName).toLowerCase();

    if (!allowedTags.has(normalized)) {
      return "";
    }

    return tag.startsWith("</") ? `</${normalized}>` : `<${normalized}>`;
  });

  return richTextToPlainText(sanitized) ? sanitized : null;
}

export function richTextHtml(value: string | null | undefined) {
  return sanitizeRichText(value) || "";
}
