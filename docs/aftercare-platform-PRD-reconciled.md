# Aftercare Compass Platform PRD - Reconciled Build Scope

Last updated: May 13, 2026

## 1. Product Direction

Aftercare Compass is a referral-ready marketplace for aftercare providers, referents, and system administrators.

The current v1 direction is:

- Seed high-quality aftercare supply first.
- Support real referrals and public leads from day one.
- Keep exact addresses private from public users and referents.
- Use Clerk for authentication.
- Use Supabase only for database, storage, and realtime capabilities.
- Use Mailgun for transactional email notifications.
- Use Stripe for subscriptions and plan enforcement.
- Defer reviews, ratings, outcome reporting, EHR integrations, SSO, and mobile apps.

## 2. Primary User Types

### Public Visitor

Public visitors can search published sober living homes and continued care programs, view privacy-safe profile pages, and submit contact requests.

Public visitors do not see exact addresses.

### Referent Organization

Referent organizations include hospitals, treatment centers, crisis centers, case management organizations, and care coordination teams.

Referent admins can:

- Complete referent onboarding.
- Search aftercare profiles.
- Submit referrals.
- Track referral status.
- Invite and remove managers.
- Manage subscription settings.

Referent managers can:

- Search profiles.
- Submit referrals where plan permissions allow.
- Track referrals for their organization.
- Use messaging where plan permissions allow.

### Aftercare Organization

Aftercare organizations include sober living homes and continued care programs.

Aftercare admins can:

- Complete provider onboarding.
- Create and manage homes or programs.
- Invite and remove managers.
- Update availability.
- Receive referrals and public leads.
- Manage subscription settings.

Aftercare managers can:

- Manage assigned homes or programs.
- Update bed availability or accepting-patient status.
- Review and respond to referrals.
- View public leads.

### System Admin

System admins can:

- View platform-wide organizations, profiles, users, referrals, leads, claims, and verification queues.
- Review onboarding submissions.
- Approve, reject, or request changes for referents, homes, and programs.
- Review profile claim requests.
- Assign or remove verified status.
- See high-level operational metrics.

Initial system admin emails:

- `dev@aftercarecompass.com`
- `admin@aftercarecompass.com`

## 3. MVP Required Scope

### Marketplace Search

The public search experience must support:

- Sober Living / Continued Care toggle.
- Location search by city, state, or program name.
- Filter overlay that does not shift result layout.
- Population served multi-select.
- Specialty populations multi-select.
- Amenities / offerings multi-select.
- Restricted medication multi-select.
- Price range.
- Distance radius filter.
- Verified filter.
- Available-now filter.
- Approximate Google Maps results.
- Map pin interaction that highlights the related listing card.

Search results must only show city/state-level location context.

### Public Profile Pages

Public profiles must show:

- Program/home name.
- Profile status badges.
- Verified badge when approved.
- Unclaimed badge when added by system admin without an owner.
- Claim workflow for unclaimed profiles.
- City and state.
- Availability.
- Pricing.
- Images.
- Services and amenities.
- Payment and clinical fit.
- About section.
- House rules.
- Approximate map.
- Public contact or referral entry points depending on user role and plan.

Public profiles must not show exact addresses.

### Public Leads

Generic public contact forms must:

- Create an internal `Lead` record.
- Notify the aftercare organization by email.
- Notify system admins where appropriate.
- Appear in the aftercare dashboard.
- Appear in the system admin dashboard.

Public lead forms are not full referrals.

### Referrals

Logged-in referents can submit de-identified referrals to aftercare profiles.

Referral workflow must support:

- Referral creation.
- Referral inbox for aftercare users.
- Referral details modal.
- Status lifecycle: pending, accepted, waitlisted, declined, placed/closed.
- Email notifications for new referrals and status changes.
- Dashboard visibility for referents and aftercare organizations.

### Messaging

Basic in-app messaging is an MVP feature for eligible plans.

Messaging should be plan-gated server-side.

### Favorites

Users can favorite homes or programs.

If a public visitor clicks favorite while logged out, the app should prompt them to log in or create an account.

## 4. Onboarding

Onboarding should be focused, recoverable, and not blocked by payment during beta.

### Onboarding Rules

- Clerk handles sign-up, sign-in, and email verification.
- If the user has no account, Create Account opens Clerk sign-up.
- If the user has an account and no completed onboarding, they return to the onboarding step where they left off.
- If the user has completed onboarding and has a dashboard, they go to the dashboard.
- If no associated dashboard exists yet, the user may return to account type selection and choose a different flow.
- Once a dashboard exists, the user cannot switch account type.
- Session failures should show a simple sign-in prompt and return the user to the correct flow.

### Sober Living Onboarding

Sober living onboarding uses a 5-step flow:

1. Program Info
   - Program/home name
   - Main address fields
   - Admissions phone
   - Admissions email
   - Website URL
   - Population served
   - Specialty populations
   - Accreditations
   - Average length of stay

2. Housing Details
   - Beds by served population
   - Total beds and available beds per population
   - Room types
   - Reserved beds notes
   - Wheelchair accessible beds
   - Price per week

3. Services and Amenities
   - Support services
   - Amenities
   - Insurance/payment accepted
   - Funding availability and notes
   - Medication policy
   - MAT accepted
   - Medication restrictions
   - Drug testing policy

4. Profile and Media
   - Home description
   - House rules
   - Profile images
   - Video URLs only
   - Preferred contact method

5. Referral Preferences
   - Referral contact method
   - Availability notes
   - Referral fit notes
   - Good Neighbor Policy acknowledgment
   - Review summary
   - Finish

### Continued Care Onboarding

Continued care onboarding should match the sober living stepper pattern, adapted for programs.

Required v1 fields:

- Program name
- Program type
- Location
- Contact details
- Website URL
- Population served
- Specialty populations
- Services offered
- Levels of care
- Insurance/payment accepted
- Funding availability
- Accepting new patients toggle
- Program description
- Referral preferences

### Referent Onboarding

Referent onboarding should capture:

- Organization name
- Organization type
- Contact details
- Role and team details
- Referral workflow needs
- Plan preference
- Optional manager invites

Payment is skipped during beta onboarding. Billing preference can be captured, but access should not fail if Stripe checkout is not completed.

## 5. Claims and Profile Ownership

System admins can create unclaimed homes and programs.

Unclaimed profiles must display an `Unclaimed` status and a Claim action.

Claim workflow:

- User clicks Claim.
- App creates a claim request.
- System admins receive an email notification.
- Claimant receives confirmation.
- System admin reviews the request.
- System admin approves or rejects.
- Approval associates the profile with the claimant's organization.
- Rejection sends a notification.
- Audit trail stores requester, reviewer, decision, timestamps, and notes.
- Once claimed, random users cannot submit competing claims unless a system admin reopens ownership.

## 6. Verification and Review

System admin review is required for onboarding submissions from non-system-admin users.

Reviewable submissions:

- Referent organizations.
- Sober living homes.
- Continued care programs.
- Claim requests.

System admin review actions:

- Approve.
- Reject.
- Request changes.

Approved homes and programs can receive a verified badge.

Reviews and ratings are not included in v1. They are post-MVP.

## 7. Dashboards

### Aftercare Dashboard

The aftercare dashboard should prioritize:

- New requests.
- Public leads.
- Quick bed or availability updates.
- Homes/programs list.
- Managers.
- Subscription.
- Account settings.

Recommended tabs:

- Overview
- Homes / Programs
- Managers
- Subscription
- Account

For sober living profiles, quick bed update should only appear when a specific home is selected, not on the all-homes overview.

New requests should combine referrals and public leads into one table with communication type tags.

### Referent Dashboard

The referent dashboard should prioritize:

- Referral activity.
- Saved/favorited profiles.
- Team managers.
- Subscription and usage.
- Account settings.

Recommended tabs:

- Overview
- Referrals
- Saved profiles
- Managers
- Subscription
- Account

Referent admins can invite multiple managers by email and remove managers with confirmation.

### System Admin Dashboard

The system admin dashboard should keep only high-level system-wide summary cards on Overview.

Recommended tabs:

- Overview
- Organizations
- Homes & Programs
- Referrals & Leads
- Claims
- Verification

Cards and tables should live inside their relevant tabs unless they are platform-wide overview metrics.

## 8. Billing and Plans

Billing lives inside the main app, not on a separate `accounts.aftercarecompass.com` app.

Stripe handles:

- Checkout.
- Subscriptions.
- Plan changes.
- Customer portal where appropriate.
- Webhooks for subscription state.

Required environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe price IDs for each plan.

Subscription pages should show:

- Current plan.
- Subscription status.
- Usage stats such as seats, homes, programs, or saved profiles.
- Change/upgrade plan action.
- Cancel plan action.

Cancel plan flow:

- User clicks cancel.
- Confirmation prompt says: `Are you sure? Your plan will end on _____.`
- Cancellation should schedule end-of-period cancellation unless immediate cancellation is explicitly required.

Plan enforcement must happen server-side.

Freemium/paywall rules will be added as a separate plan matrix update.

## 9. Notifications

Mailgun is the transactional email provider for v1.

Email notifications should cover:

- Public lead submitted.
- New referral submitted.
- Referral status changed.
- New message.
- Manager invitation sent.
- Manager removed.
- Claim request submitted.
- Claim approved.
- Claim rejected.
- Onboarding submission approved.
- Onboarding submission rejected or changes requested.
- Subscription status changes where needed.

Email sending should return a clear success/failure result for user-triggered actions such as invites.

## 10. Images and Media

Profile images are supported in v1.

Image handling:

- Upload to Supabase Storage.
- Compress client-side before upload.
- Enforce reasonable max file size.
- Store uploaded image references on the profile.
- Show profile images on search cards and profile pages.

Videos are URL-only in v1.

Uploaded video hosting is post-MVP.

## 11. Maps and Location Privacy

Google Maps is used for public search and profile map displays.

Map rules:

- Show approximate locations only.
- Do not expose exact addresses to public users or referents.
- Search results can show city/state.
- Profile pages can show city/state and an approximate map.
- Aftercare users and system admins can see exact addresses for profiles they manage or administer.

## 12. SMS Availability Checks

SMS availability checks are planned but paused until the Twilio account is ready for production messaging.

Future flow:

- System sends availability check text to aftercare manager.
- Manager replies with available beds or availability confirmation.
- App parses response.
- App updates availability after validation.
- App logs the source of the update.

Twilio A2P 10DLC registration is required before reliable production texting.

## 13. Data Model Updates

The v1 data model should include or support:

- Organizations
- Users
- Organization memberships
- Organization invites
- Aftercare profiles
- Continued care availability
- Sober living bed availability by population served
- Profile images
- Leads
- Referrals
- Messages
- Favorites
- Verification/application reviews
- Profile claim requests
- Claim audit trail
- Subscription/customer metadata
- SMS availability checks, deferred

No review/rating models should be active in v1.

## 14. Technical Stack

Current stack:

- Next.js App Router
- TypeScript
- Clerk for authentication
- Supabase Postgres for database
- Prisma ORM
- Supabase Storage for profile images
- Supabase Realtime where needed
- Mailgun for transactional email
- Stripe for billing and subscriptions
- Google Maps for public maps
- Twilio for future SMS availability checks
- Vercel for hosting and deployment

Supabase Auth is not used.

Prisma should use the Supabase transaction pooler for runtime connections, with migration-safe direct connection configuration.

## 15. Deferred / Post-MVP

The following are not part of v1:

- Reviews and ratings.
- Rating-based search sort.
- EHR/API integrations.
- SSO/SAML.
- Outcome reporting.
- Advanced analytics.
- Mobile app.
- Algolia or external full-text search service.
- Uploaded video hosting.
- Patient self-search mode.
- Automated certification expiry downgrade.
- Production SMS availability automation until Twilio registration is ready.

## 16. Acceptance Criteria

### Marketplace

- Public users can search sober living and continued care profiles.
- Public users can filter by location, type, population, amenities, price, distance, verified status, and availability.
- Public users can view profile pages without seeing exact addresses.
- Public users can submit contact requests that create internal leads.

### Onboarding

- New users can create an account and enter the correct onboarding flow.
- Users can leave onboarding and resume the correct step.
- Users can switch account type before a dashboard exists.
- Users cannot switch account type after a dashboard exists.
- Sober living and continued care providers can complete profile onboarding.
- Referents can complete organization onboarding.

### Referrals and Leads

- Referents can submit referrals.
- Aftercare users can view referral details in a modal.
- Aftercare users can accept, waitlist, decline, or mark placed.
- Public contact forms create leads.
- Emails are sent for lead submission, referral submission, and referral status changes.

### Dashboards

- Aftercare users can update availability quickly.
- Aftercare admins can invite and remove managers.
- Referent admins can invite and remove managers.
- Users can view current subscription details and usage.
- System admins can review applications, claims, organizations, profiles, referrals, and leads.

### Billing

- Stripe checkout and subscription webhooks update subscription state.
- Subscription state controls paid features server-side.
- Cancel plan confirmation displays the plan end date.

### Privacy and Trust

- Exact addresses never appear on public or referent-facing pages.
- Verified badges only appear after system admin approval.
- Unclaimed profiles can be claimed through an admin-reviewed workflow.
- One email address can belong to only one organization.
