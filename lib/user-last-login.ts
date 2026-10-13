import { clerkClient } from "@clerk/nextjs/server";

// Missing entries indicate a failed lookup or an account no longer in Clerk.
// A null value means Clerk explicitly reports that the user has never signed in.
export async function getUserLastLogins(clerkUserIds: string[]) {
  const result = new Map<string, number | null>();
  const ids = [...new Set(clerkUserIds.filter(Boolean))];
  if (!ids.length) return result;
  try {
    const client = await clerkClient();
    for (let offset = 0; offset < ids.length; offset += 100) {
      const batch = ids.slice(offset, offset + 100);
      const { data } = await client.users.getUserList({ userId: batch, limit: batch.length });
      for (const user of data) result.set(user.id, user.lastSignInAt);
    }
  } catch {
    // Keep the directory usable if the authentication service is unavailable.
    console.warn("Admin last-login lookup unavailable.");
  }
  return result;
}

export function formatLastLogin(value: number | null | undefined) {
  if (value === undefined) return "Unavailable";
  if (value === null) return "Never signed in";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short"
  }).format(date);
}
