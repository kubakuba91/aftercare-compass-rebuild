# Phase 2 Implementation Backlog

This backlog is ordered for a referral-ready, aftercare-first beta. Each epic should end with working software and tests before the next dependent epic starts.

## Epic 1: Application Foundation

Build:

- Next.js App Router project with TypeScript, Tailwind, and shadcn/ui.
- Route groups for public, auth/onboarding, referent dashboard, aftercare dashboard, admin dashboard, and API routes.
- Environment variable structure for Clerk, Supabase, Stripe, Resend, maps, and app URLs.
- Base layout, navigation shells, dashboard shell, and shared UI primitives.

Acceptance gate:

- App runs locally.
- Public, auth, and protected dashboard shells render.
- Protected routes redirect unauthenticated users.

## Epic 2: Auth, Organizations, Roles, And Plan Guards

Build:

- Clerk sign-up/sign-in with email verification.
- Account type selection after verification.
- User and organization database records synced with Clerk.
- Role checks for Referent Admin, Referent Manager, Aftercare Admin, Aftercare Manager, and System Admin.
- One-organization-per-email enforcement.
- Server-side plan gate helpers.

Acceptance gate:

- Users cannot continue onboarding before email verification.
- Email already tied to an org cannot create or join another org.
- Role and organization access checks work in route handlers/server actions.

## Epic 3: Database Schema And Storage

Build:

- Prisma schema for users, organizations, referent details, aftercare profiles, profile media, certifications, documents, referrals, messages, leads, flags, favorites, saved searches, notifications, and subscriptions.
- Supabase Storage buckets for profile photos, private verification documents, and house rules.
- PostGIS support for internal location search.

Acceptance gate:

- Initial migration runs.
- Private documents are not publicly readable.
- Schema excludes reviews and ratings.

## Epic 4: Aftercare Onboarding And Profile Management

Build:

- Sober Living onboarding with resumable steps.
- Continued Care onboarding with resumable steps.
- Draft and publish profile states.
- Sober Living bed validation and availability.
- Continued Care accepting-new-patients toggle.
- Photo upload and video URL support.
- Profile edit screens in Aftercare dashboard.

Acceptance gate:

- Aftercare Admin can publish a compliant profile.
- Draft profile is hidden from search.
- Published profile appears in search.
- Exact address is visible only to authorized aftercare users and system admins.

## Epic 5: Public Marketplace And Lead Capture

Build:

- Public search entry and results.
- Filters and sorting for v1.
- Public Sober Living profile page.
- Public Continued Care profile page.
- Generic contact form.
- Lead creation and lead notification email.

Acceptance gate:

- Public visitor can search, view profile, and submit contact form.
- Lead record is created.
- Email sends through Resend.
- No referral record is created from public contact.
- No exact address is exposed.

## Epic 6: Referent Onboarding, Billing, And Search

Build:

- Referent onboarding flow.
- Stripe checkout for referent plans.
- Subscription status sync.
- Referent search and favorites.
- Referent dashboard shell with overview, referrals, favorites, team basics, subscription, and settings.

Acceptance gate:

- Referent Admin can create org and subscribe.
- Referent users can search and favorite profiles.
- Paid feature access follows server-side subscription state.

## Epic 7: Referral Workflow

Build:

- De-identified referral form on profile pages for logged-in referent users.
- Referral creation with `pending` status.
- Aftercare referral inbox.
- Referent referral tracking.
- Status transition actions and validation.
- Referral emails and in-app notifications.

Acceptance gate:

- Referent can submit referral.
- Aftercare can view and update status.
- Invalid status transitions are blocked.
- Decline and waitlist required details are enforced.
- Status changes notify the referent.

## Epic 8: Messaging

Build:

- One message thread per referral.
- Message compose and read views.
- Plan-gated messaging access.
- Email notification for new messages.
- Supabase Realtime updates where practical.

Acceptance gate:

- Eligible referent and aftercare users can exchange messages.
- Ineligible plans are blocked server-side.
- Users outside participating orgs cannot read messages.

## Epic 9: Admin Verification And Flags

Build:

- System Admin dashboard.
- Verification queue and document review.
- Approve, reject, and request-more-info actions.
- Flag/report submission and admin review.
- Profile suspension controls.

Acceptance gate:

- Admin can process verification documents.
- Verification status updates display on profiles.
- Admin can review and resolve flags.
- Private documents remain private.

## Epic 10: Notifications, QA, And Beta Readiness

Build:

- Notification records and user notification views.
- Resend templates for leads, referrals, status changes, and messages.
- Stripe webhook hardening.
- Seed data for demos and beta testing.
- End-to-end QA against the launch checklist.

Acceptance gate:

- Required emails send successfully.
- Launch QA checklist is completed.
- Beta users can complete the core aftercare and referent journeys.

