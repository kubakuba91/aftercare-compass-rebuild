# Sober-living Basic trials

Sober-living organization administrators can select one 30-day, no-card Aftercare Basic trial from Dashboard → Subscription. The internal plan key is `professional`; the displayed name is Aftercare Basic. The trial starts at selection, after access to the completed-onboarding dashboard. Existing eligible accounts receive a fresh 30 days when they select it; this release does not automatically enroll or charge any account.

Eligibility requires a sober-living organization on an unset/free plan, no Stripe subscription, no prior trial dates, and an unset, incomplete, or active subscription status. Managers cannot start trials. The action derives the organization from the authenticated user, uses an atomic conditional update, and writes an audit record in the same transaction. It never calls Stripe.

Basic includes one profile, three manager seats, 12 photos, direct referral intake, live availability, operational analytics, and eligibility to request verification. It does not include messaging or automatically grant a verified badge.

Expiration is evaluated on each server request. Expired trials use the free Claimed Listing plan without requiring a background job. Paid capabilities stop, and new manager invitations/photo uploads use the free limits. Existing records, photos, profiles, and team accounts are retained. Existing team access is not revoked. The dashboard displays a countdown, end date, and expiration notice; this release does not send scheduled reminder emails. The database retains trial history and the `trialing` status for audit/extension; admin and provider UI display expiration explicitly.

A paid subscription with active status takes precedence over old trial dates. Stripe checkout and webhook handling are unchanged. Changing to a free listing does not erase trial dates or allow a second trial. System admins can extend a no-card referent or sober-living trial by 1–90 days with a reason; the existing extension audit records the actor and old/new dates.

## Data compatibility

Prisma exposes generic `trialStartedAt`, `trialEndsAt`, and `TrialExtension` names mapped to the existing `referentTrialStartedAt`, `referentTrialEndsAt`, and `ReferentTrialExtension` database objects. The old index name is retained explicitly. Prisma schema comparison reports an empty migration: no DDL or backfill is required. Existing referent trials remain unchanged. Regenerate Prisma Client as part of the build.

## Verification

Run `node --import tsx --test tests/*.test.ts tests/*.test.cjs`, `npm run typecheck`, `npm run lint`, and `npm run build`. Tests cover start authorization, organization scope, one-time eligibility, conditional-update races, audit writes, exact expiration, missing end dates, Basic/free limits, and paid upgrades; existing referent trial tests remain enabled.
