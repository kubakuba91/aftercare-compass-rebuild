# Referent trial and paid onboarding

## Behavior

Referent onboarding requires an explicit choice: a 30-day Professional trial without a payment method, or Starter/Professional subscription checkout. Enterprise remains contact-sales only. Paid onboarding saves the organization as incomplete and redirects to Stripe; server-confirmed subscription state controls access. A canceled or failed checkout preserves setup and offers payment retry or an eligible trial. Trial enrollment has no billing cycle and never creates an automatically charging subscription.

Trial expiration is evaluated on every gated request, including referral API submissions, profile referral actions, screening booking, and manager invitations. Browsing and historical records remain available. Messaging eligibility also checks expiration. Existing placeholder features (saved searches, alerts, etc.) must use the same access check when implemented.

The organization can start one self-service trial. Atomic updates prevent restarting a used trial; onboarding membership assignment is transactional to prevent duplicate completion creating another organization. System administrators can extend an existing no-card trial by 1–90 days, including an expired trial. Each extension stores actor, reason, previous end, new end, and timestamp in ReferentTrialExtension. Stripe subscriptions must be managed through billing, not the local trial extension form.

## Release order

1. Apply prisma/migrations/20260922000000_referent_trials/migration.sql in a transaction before deploying the application. Confirm production migration history before using Prisma migrate deploy: the existing database has historically had migrations applied without corresponding history rows. Do not blindly replay older migrations.
2. This migration gives existing no-card referent organizations with trialing status a fresh 30-day Professional trial beginning when the migration runs. It does not change active subscriptions, Stripe subscriptions, or aftercare organizations.
3. Deploy application code. No new Stripe products or environment variables are required; existing referent monthly/annual price IDs and webhook configuration are used.
4. Verify in a test environment: trial signup, paid signup, checkout cancellation/retry, paid webhook activation, expiry boundary, a manager attempting billing/admin actions, an admin extending an expired trial, and repeated onboarding/trial submissions. Do not use a real card for automated payment verification.

## Validation

Local lifecycle assertions cover explicit enrollment, no access before payment, exact trial expiry, no repeat trial, paid access after trial expiry, and unchanged aftercare eligibility. Existing virtual-care, import, and admin-delivery regression suites are also run. Full authenticated browser checkout and production migration are separate release checks.
