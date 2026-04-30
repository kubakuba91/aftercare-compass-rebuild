export function hasDatabaseConfig() {
  return Boolean(hasValidDatabaseUrl() && hasValidDirectUrl());
}

function hasValidPostgresUrl(value?: string) {
  return Boolean(value?.startsWith("postgresql://") || value?.startsWith("postgres://"));
}

function usesSupabaseTransactionPooler(value?: string) {
  return Boolean(value?.includes(".pooler.supabase.com:6543"));
}

function hasPgBouncerFlag(value?: string) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).searchParams.get("pgbouncer") === "true";
  } catch {
    return false;
  }
}

function hasConnectionLimit(value?: string) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).searchParams.get("connection_limit") === "1";
  } catch {
    return false;
  }
}

export function hasValidDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!hasValidPostgresUrl(value)) {
    return false;
  }

  if (usesSupabaseTransactionPooler(value) && (!hasPgBouncerFlag(value) || !hasConnectionLimit(value))) {
    return false;
  }

  return true;
}

export function hasValidDirectUrl() {
  return hasValidPostgresUrl(process.env.DIRECT_URL);
}

export const databaseEnvRequirements = [
  {
    key: "DATABASE_URL",
    valueHint: "Supabase transaction pooler URL with ?pgbouncer=true&connection_limit=1",
    valid: hasValidDatabaseUrl()
  },
  {
    key: "DIRECT_URL",
    valueHint: "Supabase session pooler or direct URL for Prisma migrations",
    valid: hasValidDirectUrl()
  }
] as const;

export function missingDatabaseResponse() {
  return {
    error: "Database is not configured.",
    required: ["DATABASE_URL", "DIRECT_URL"],
    next: "Use the Supabase transaction pooler for DATABASE_URL with ?pgbouncer=true&connection_limit=1, and use DIRECT_URL for migrations."
  };
}
