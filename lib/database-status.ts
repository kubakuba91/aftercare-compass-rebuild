export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);
}

export const databaseEnvRequirements = [
  {
    key: "DATABASE_URL",
    valueHint: "Supabase transaction pooler URL, ideally ending with ?pgbouncer=true",
    valid: Boolean(process.env.DATABASE_URL?.startsWith("postgresql://"))
  },
  {
    key: "DIRECT_URL",
    valueHint: "Supabase session pooler or direct URL for Prisma migrations",
    valid: Boolean(process.env.DIRECT_URL?.startsWith("postgresql://"))
  }
] as const;

export function missingDatabaseResponse() {
  return {
    error: "Database is not configured.",
    required: ["DATABASE_URL", "DIRECT_URL"],
    next: "Create a Supabase project, add the pooled DATABASE_URL and direct DIRECT_URL, then run Prisma migrations."
  };
}
