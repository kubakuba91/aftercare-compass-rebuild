# Supabase And Prisma Setup

Use this when moving from the static Phase 1 scaffold to real database-backed flows.

## 1. Create Supabase Project

Create a Supabase project for the app. Keep Supabase scoped to:

- PostgreSQL database
- Storage
- Realtime

Authentication remains Clerk.

## 2. Add Vercel Environment Variables

In Vercel Project Settings, add:

```txt
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

For Prisma:

- `DATABASE_URL` should use Supabase's pooled connection string.
- `DIRECT_URL` should use Supabase's direct connection string for migrations.

## 3. Add Local Environment Variables

Create `.env.local` for Next.js runtime values and `.env` for Prisma CLI values if needed.

Do not commit either file.

## 4. Run Migration

After `DATABASE_URL` and `DIRECT_URL` are available locally:

```bash
npm run prisma:generate
npm run db:migrate
```

For production deploys:

```bash
npm run db:deploy
```

## 5. Optional Seed

Seed one published aftercare profile for local testing:

```bash
npm run db:seed
```

## 6. Current Data Rules

- Reviews and ratings are intentionally absent.
- Public leads are stored separately from referrals.
- Referral forms remain de-identified.
- Exact addresses are stored for operations but not shown to public or referent users.
- Continued Care uses `acceptingNewPatients`; Sober Living uses bed availability.

