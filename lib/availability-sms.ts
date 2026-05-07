export type ParsedAvailabilityReply = {
  token?: string;
  men?: number;
  women?: number;
  lgbtq?: number;
  noChange?: boolean;
};

function integerAfterLabel(body: string, labels: string[]) {
  for (const label of labels) {
    const match = body.match(new RegExp(`\\b${label}\\b\\s*[:=-]?\\s*(\\d+)`, "i"));

    if (match) {
      return Number(match[1]);
    }
  }

  return undefined;
}

export function parseAvailabilityReply(body: string): ParsedAvailabilityReply | null {
  const normalized = body.trim();

  if (!normalized) {
    return null;
  }

  const tokenMatch = normalized.match(/\bAC-[A-Z0-9]{4,8}\b/i);
  const noChange = /\b(no change|same|unchanged)\b/i.test(normalized);
  const parsed = {
    token: tokenMatch?.[0]?.toUpperCase(),
    men: integerAfterLabel(normalized, ["men", "male", "m"]),
    women: integerAfterLabel(normalized, ["women", "woman", "female", "w"]),
    lgbtq: integerAfterLabel(normalized, ["lgbtq\\+", "lgbtq", "lgbt", "queer", "q"]),
    noChange
  };

  if (
    parsed.token ||
    parsed.noChange ||
    parsed.men !== undefined ||
    parsed.women !== undefined ||
    parsed.lgbtq !== undefined
  ) {
    return parsed;
  }

  const numbers = normalized.match(/\d+/g)?.map(Number) ?? [];

  if (numbers.length === 1) {
    return { men: numbers[0] };
  }

  if (numbers.length >= 3) {
    return {
      men: numbers[0],
      women: numbers[1],
      lgbtq: numbers[2]
    };
  }

  return null;
}

export function availabilityReplyExample() {
  return "Reply like: AC-1234 MEN 2 WOMEN 1 LGBTQ 0. Or reply NO CHANGE.";
}
