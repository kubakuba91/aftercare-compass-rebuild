export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

export function missingDatabaseResponse() {
  return {
    error: "Database is not configured.",
    required: ["DATABASE_URL", "DIRECT_URL"],
    next: "Create a Supabase project, add the pooled DATABASE_URL and direct DIRECT_URL, then run Prisma migrations."
  };
}

