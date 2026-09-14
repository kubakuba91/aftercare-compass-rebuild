# Virtual-only Continued Care release

## Product decisions

Continued Care delivery selection adapts onboarding and the editor. New programs choose in-person or virtual-only. Existing hybrid values remain readable; mixed organizations are deferred. Virtual programs use one organization subscription. Insurance varies by state through a single notes field, never duplicate profiles solely for insurance.

| Plan | Monthly | Annual | Coverage | Profiles | Managers |
| --- | ---: | ---: | --- | ---: | ---: |
| Virtual Basic | $249 | $2,490 | One state | 1 | 3 |
| Virtual Growth | $449 | $4,490 | Multiple states, short of nationwide | 5 | 10 |
| Virtual Network | $699 | $6,990 | All 50 states + DC | Unlimited | Unlimited |

All paid virtual plans include the same referral, messaging, tracking, analytics, and verification eligibility features. Verification still requires review. Free claimed listings remain available. Coverage is the union of states served across the organization's programs. Choose the tier that covers coverage AND program/team scale.

## Deployment prerequisites

Do not deploy the new application against the old schema. The production Vercel environment pull returns [SENSITIVE] placeholders for DATABASE_URL, DIRECT_URL and STRIPE_SECRET_KEY; these are not working credentials.

1. In an environment with real database credentials, run `npx prisma migrate status` and inspect pending migrations. Apply the additive `20260914000000_virtual_continued_care` migration using the project's normal migration process (`npx prisma migrate deploy` after confirming the migration history). It adds statesServed, insuranceNotes and programmingTimeZone. Existing rows receive an empty state list; existing telehealth-only imports need coverage completed before publishing or paid checkout.
2. In an environment with the correct Stripe account's secret key, run `node scripts/configure-virtual-prices.mjs` to inspect. Run again with `--apply` to create missing products/prices. It reuses lookup keys and validates amounts, currency, and recurrence. It does not create or change any customer subscription.
3. Set the six returned STRIPE_AFTERCARE_VIRTUAL_*_PRICE_ID variables on the production Vercel project (and separately provision test prices for preview). Keep the existing prices and webhook endpoint. Do not copy live secrets into preview.
4. Build and deploy only after the migration and prices are ready.
5. Verify an authenticated virtual onboarding, editing, claim, free-to-paid checkout, plan change and webhook in a test environment. Confirm published state matching and that the map excludes virtual profiles. Check invitation and manager limits, including existing invitations. Check existing in-person onboarding and billing.

## Local verification

- `npm run prisma:generate`
- `npm run typecheck`
- `npm run lint`
- `node --import tsx tests/virtual-care.test.ts`
- `npm run build`

Live database integration and real Stripe Checkout cannot be verified without usable configured credentials. Do not claim these checks passed based only on a successful compile.

## Bulk imports

The admin template includes physical and virtual examples. Existing CSV headers remain compatible. For virtual Continued Care, set `delivery_mode` to `Virtual only`, provide `states_served` (semicolon-separated full names or abbreviations, or `Nationwide` for 50 states + DC), and `programming_time_zone` from the onboarding time zones. `insurance_notes` is optional. Physical address fields may be blank; capacity is ignored.

Virtual rows match by organization and program name, independently of address. Keep program names consistent in repeat import files; renaming a program in the CSV represents a new identity. Separate virtual and physical organizations are required. New imports remain unclaimed and do not create subscriptions or change billing. Review coverage in the import preview before committing.

Checks: `node --import tsx tests/provider-csv-import.test.ts`. The checks use database stubs; a real admin upload/commit remains part of deployment verification after applying the virtual schema migration.
