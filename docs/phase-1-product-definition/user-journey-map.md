# User Journey Map

## Public Visitor

1. Lands on public search.
2. Searches for Sober Living or Continued Care by city, state, or zip.
3. Applies filters.
4. Opens a public profile.
5. Sees profile information, verification tier, availability, price, services, insurance, and city/state location.
6. Submits generic contact form.
7. System creates an internal lead and emails the aftercare admissions contact.

Success criteria:
- Visitor can submit a contact request without creating an account.
- Exact street address is never displayed.
- Contact request is saved as a lead for internal tracking.

## Referent Admin

1. Creates account with Clerk.
2. Verifies email.
3. Selects "I refer patients."
4. Creates referent organization.
5. Completes organization and referral context details.
6. Selects subscription plan through Stripe.
7. Invites team members or skips.
8. Searches profiles.
9. Submits and tracks referrals.
10. Manages team, subscription, and account settings.

Success criteria:
- Subscription state controls paid features.
- Admin can manage organization-level settings.
- Email cannot be reused in another organization.

## Referent Manager

1. Receives invite or is added by Referent Admin.
2. Signs in and verifies email if needed.
3. Searches and filters profiles.
4. Favorites profiles.
5. Submits de-identified referral form.
6. Tracks status changes.
7. Sends messages when plan permits.

Success criteria:
- Referral form never collects direct patient identifiers.
- User sees only referrals from their organization.
- Messaging access follows subscription plan.

## Aftercare Admin

1. Creates account with Clerk.
2. Verifies email.
3. Selects Sober Living or Continued Care account type.
4. Completes onboarding.
5. Selects subscription plan through Stripe.
6. Publishes profile or saves draft.
7. Updates availability.
8. Receives leads and referrals.
9. Manages referral inbox and documents.
10. Manages team and profile assignments.

Success criteria:
- Provider can publish a compliant profile.
- Provider can receive both public leads and structured referrals.
- Exact address remains visible only to authorized aftercare users and system admins.

## Aftercare Manager

1. Signs in under assigned organization.
2. Views only assigned profiles.
3. Updates bed availability or accepting-new-patients status.
4. Views referral inbox for assigned profiles.
5. Marks referrals viewed, accepted, declined, waitlisted, placed, or closed.
6. Sends messages when plan permits.

Success criteria:
- Manager cannot access unassigned profiles.
- Availability updates are timestamped.
- Referral status changes notify referent users.

## System Admin

1. Signs in as system admin.
2. Views platform metrics.
3. Reviews verification queue.
4. Approves, rejects, or requests more information for documents.
5. Reviews flags/reports.
6. Manages users and subscriptions.
7. Monitors marketplace integrity.

Success criteria:
- Admin can manage trust workflows without editing unrelated profile data.
- Admin can suspend or flag profiles when needed.
- Admin can see private operational data, including exact addresses and verification documents.

