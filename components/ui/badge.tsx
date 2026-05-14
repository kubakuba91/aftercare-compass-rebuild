import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "verified" | "warning" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "ac-chip--neutral",
  verified: "ac-chip--verified",
  warning: "ac-chip--warning",
  success: "ac-chip--success"
};

const lowerCaseWords = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "with"]);

function titleCaseWord(word: string, index: number) {
  if (!word) {
    return word;
  }

  const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, "");

  if (/^\d+$/.test(cleanWord) || /^[A-Z0-9+&/-]{2,}$/.test(cleanWord)) {
    return word;
  }

  const lowerWord = word.toLocaleLowerCase();

  if (index > 0 && lowerCaseWords.has(lowerWord)) {
    return lowerWord;
  }

  return lowerWord.replace(/(^|[-/])(\p{L})/gu, (_match, separator: string, letter: string) => {
    return `${separator}${letter.toLocaleUpperCase()}`;
  });
}

function formatBadgeText(value: string) {
  return value
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const label = typeof children === "string" ? formatBadgeText(children) : children;

  return (
    <span
      className={cn(
        "ac-chip",
        tones[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
