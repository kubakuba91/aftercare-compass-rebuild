# Aftercare Placement Platform: Phase 1 Product Blueprint

## Objective

Build a referral-ready B2B marketplace that helps referent organizations discover aftercare providers, submit de-identified referrals, and track placement workflows. The first beta prioritizes high-quality aftercare supply while preserving enough referent functionality to validate real referral demand.

## V1 Product Shape

The v1 product is a two-sided marketplace with operational dashboards:

- Public visitors can search and browse profiles, then submit generic contact requests.
- Referent organizations can subscribe, search, favorite profiles, submit referrals, and track referral status.
- Aftercare organizations can onboard, publish profiles, manage availability, receive leads/referrals, and respond to referral workflows.
- System admins can verify profiles, review documents, manage flags, and monitor marketplace operations.

## Non-Negotiable Product Rules

- No reviews, ratings, highest-rated sort, or review dashboard in v1.
- No exact address exposure to public users or referents.
- Referral data is de-identified and must not request patient name, DOB, direct contact information, or other direct identifiers.
- Public contact form submissions create internal lead records and send notification emails.
- Continued Care programs expose `accepting_new_patients` instead of bed counts.
- Sober Living homes expose bed availability.
- Clerk owns authentication and email verification.
- Supabase is used only for Postgres/PostGIS, Storage, and Realtime.
- Stripe subscription state controls paid feature access server-side.

## MVP Required Scope

- Aftercare onboarding for Sober Living and Continued Care programs.
- Aftercare profile creation with draft/published status, media, services, certifications, privacy-safe location, and availability.
- Continued Care accepting-new-patients availability toggle.
- Sober Living bed availability management.
- Public search and public profile pages.
- Generic public contact form that creates a `Lead` record and emails admissions.
- Referent onboarding and subscription setup.
- Referral form for logged-in referents.
- Referral inbox and status lifecycle.
- Basic in-app messaging for eligible plans.
- Referent dashboard.
- Aftercare dashboard.
- System Admin verification queue.
- Stripe subscriptions and plan enforcement.
- Email notifications for leads, referrals, status changes, and messages.

## Beta Nice-To-Have Scope

- Saved searches and bed alerts.
- Waitlist management.
- More advanced dashboard analytics.
- Certification expiry reminders and auto-downgrade.
- Team invite flows beyond minimum admin-created accounts.
- Search map view after list search works reliably.

## Post-MVP Scope

- Reviews and ratings.
- EHR/API integrations.
- SSO/SAML.
- Outcome reporting.
- Advanced analytics.
- Mobile app.
- Algolia or other dedicated full-text search service.
- Uploaded video hosting.
- Patient self-search mode.

## Phase 2 Build Order

1. Project foundation, auth, route structure, database schema, and role/plan guards.
2. Aftercare onboarding and profile management.
3. Public search, profile pages, and public lead capture.
4. Referent onboarding, subscription setup, and referral form.
5. Referral inbox, status lifecycle, and messaging.
6. Dashboards for Referent, Aftercare, and System Admin.
7. Verification workflow, document handling, flags, and admin controls.
8. Stripe webhooks, Resend email templates, realtime updates, and launch QA.

## Definition Of Done For Phase 1

Phase 1 is complete when the product team and engineering team can start Phase 2 without making additional decisions about v1 scope, role access, review removal, data visibility, lead capture, referral workflow, or subscription gates.

