# Workflow Acceptance Criteria

## Aftercare Onboarding And Profile Publishing

- User can create account with Clerk and cannot proceed until email is verified.
- User can choose Sober Living or Continued Care onboarding.
- Progress saves at stage boundaries.
- Sober Living profile validates required fields, total beds, and bed breakdown.
- Continued Care profile validates required fields and accepting-new-patients status.
- At least one photo is required before publishing.
- Video fields accept URLs only.
- Published profiles appear in public search.
- Draft profiles do not appear in public search.
- Exact street address does not appear on public or referent-facing views.

## Public Search And Lead Capture

- Public visitor can search by city, state, or zip.
- Public visitor can filter by relevant profile attributes.
- Public visitor can open a profile and view city/state location.
- Public visitor can submit generic contact form.
- Generic contact form creates a `Lead` record.
- Generic contact form sends email via Resend to admissions contact.
- Generic contact form does not create a referral.

## Referent Signup And Referral Submission

- Referent admin can create account, verify email, create org, and select subscription.
- Email already tied to another org cannot create or join a second org.
- Referent user can search and view profiles without seeing exact addresses.
- Referent user can submit a de-identified referral form.
- Referral form rejects direct patient identifiers if fields are attempted through API.
- Referral is created with `pending` status.
- Aftercare admissions contact receives referral email.
- Referral appears in both referent and aftercare dashboards.

## Referral Status Lifecycle

Allowed transitions:

```text
pending -> viewed
viewed -> accepted
viewed -> declined
viewed -> waitlisted
waitlisted -> accepted
waitlisted -> declined
accepted -> placed
accepted -> closed
pending -> closed
viewed -> closed
waitlisted -> closed
placed -> closed
```

Acceptance criteria:

- Unauthorized status transitions are rejected server-side.
- Declined referrals require a decline reason.
- Waitlisted referrals require waitlist position or expected availability date.
- Status changes update `status_updated_at`.
- Status changes notify the referent user by email and in-app notification.

## Messaging

- Messaging is available only for eligible plans.
- Messages are scoped to one referral.
- Only users from the participating referent org, recipient aftercare org, and system admins can access the thread.
- New messages create email and in-app notifications.
- Read receipts update when a participant views a message.

## Admin Verification

- System Admin can view submitted verification documents.
- System Admin can approve, reject, or request more information.
- Verification decision updates profile verification tier or document status.
- Rejected or more-info decisions can include admin notes.
- Private verification documents are not visible to public users or referents.

## No Reviews Or Ratings

- No `Review` model exists.
- No rating fields exist on profiles.
- No review dashboard exists.
- No highest-rated sort exists.
- No placement review prompt appears after referral is marked placed.

