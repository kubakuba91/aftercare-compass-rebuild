# Dashboard subdomain migration

The public marketplace and authenticated application remain in one Next.js deployment. The deployment serves two canonical origins:

- `https://www.aftercarecompass.com` for public search, provider profiles, claim links, and legal pages.
- `https://dashboard.aftercarecompass.com` for sign-in, sign-up, onboarding, setup, and all dashboard routes.

Keeping one deployment avoids a second build pipeline, duplicated environment configuration, and cross-application database/API contracts during the migration.

## Production environment

Set these variables on the existing Vercel project:

```text
NEXT_PUBLIC_APP_URL=https://www.aftercarecompass.com
NEXT_PUBLIC_PUBLIC_APP_URL=https://www.aftercarecompass.com
NEXT_PUBLIC_DASHBOARD_APP_URL=https://dashboard.aftercarecompass.com
```

`NEXT_PUBLIC_APP_URL` remains as a compatibility fallback while the migration is in progress. New URL generation should use the public or dashboard-specific helpers in `lib/app-urls.ts`.

## Vercel and DNS

1. Add `dashboard.aftercarecompass.com` to the same Vercel project as `www.aftercarecompass.com`.
2. Create the DNS record requested by Vercel and wait for certificate issuance.
3. Deploy with the three production URL variables above.
4. Confirm that `/dashboard`, `/sign-in`, `/sign-up`, `/auth/*`, `/onboarding/*`, and `/setup` redirect from `www` to `dashboard`.
5. Confirm that `/search`, `/profiles/*`, `/claim-profile/*`, and legal pages redirect from `dashboard` to `www`.

## Clerk

Before sending production traffic to the subdomain:

1. Add `https://dashboard.aftercarecompass.com` as an allowed application origin in Clerk.
2. Allow the callback `https://dashboard.aftercarecompass.com/auth/complete` for every enabled sign-in method, including Google OAuth.
3. Keep sign-in and sign-up hosted on the dashboard origin so the authenticated session is established where dashboard requests are served.
4. Test new sign-up, existing sign-in, sign-out, password reset, Google OAuth, and invitation acceptance in a preview environment first.

## External callbacks and links

- Stripe checkout and billing-portal return URLs use the dashboard origin.
- Dashboard links in transactional emails use the dashboard origin.
- Provider profiles, claim outreach, and unsubscribe links continue to use the public origin.
- Existing relative dashboard links continue to work after the browser reaches the dashboard origin.

## Rollback

Set `NEXT_PUBLIC_DASHBOARD_APP_URL` to the same value as `NEXT_PUBLIC_PUBLIC_APP_URL` and redeploy. When both origins resolve to the same host, host-level canonical redirects are disabled and the application returns to its previous single-origin behavior.
