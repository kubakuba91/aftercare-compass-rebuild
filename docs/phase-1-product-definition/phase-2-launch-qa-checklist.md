# Phase 2 Through Launch QA Checklist

## Scope Checks

- [ ] V1 feature list matches the MVP Required scope.
- [ ] Beta Nice-To-Have features are not blocking MVP release.
- [ ] Post-MVP features are not accidentally implemented as partial dead-end code.
- [ ] Reviews and ratings are absent from schema, routes, UI, and search sorting.

## Auth And Organization Checks

- [ ] Clerk sign-up and sign-in work.
- [ ] Email verification is required before onboarding continuation.
- [ ] One email address cannot join multiple organizations.
- [ ] Role metadata in Clerk matches the app database.
- [ ] Protected routes enforce server-side role checks.

## Privacy And Compliance Checks

- [ ] Public profile pages never show street address.
- [ ] Referent-facing profile pages never show street address.
- [ ] Search maps do not expose exact locations.
- [ ] Referral form does not collect patient name, DOB, email, phone, address, or MRN.
- [ ] Verification documents are stored privately.
- [ ] Ownership disclosure is private.
- [ ] No per-referral or per-placement billing exists.

## Aftercare Checks

- [ ] Sober Living onboarding can be completed and resumed.
- [ ] Continued Care onboarding can be completed and resumed.
- [ ] Sober Living bed counts validate correctly.
- [ ] Continued Care accepting-new-patients toggle displays correctly.
- [ ] At least one photo is required to publish.
- [ ] Video URL fields accept valid URLs and reject invalid inputs.
- [ ] Draft profiles stay hidden from search.
- [ ] Published profiles appear in search.

## Public Marketplace Checks

- [ ] Public visitor can search by city, state, or zip.
- [ ] Filters return expected profiles.
- [ ] Sorting works for relevance, price, distance, and availability.
- [ ] Generic contact form creates a lead.
- [ ] Generic contact form sends a Resend email.
- [ ] Public lead does not create a referral.

## Referent Checks

- [ ] Referent admin can subscribe.
- [ ] Referent manager can search and favorite profiles.
- [ ] Referent user can submit a de-identified referral.
- [ ] Referral appears in referent dashboard.
- [ ] Referent user receives status-change email notifications.

## Referral And Messaging Checks

- [ ] New referral appears in aftercare inbox.
- [ ] Referral status lifecycle accepts only valid transitions.
- [ ] Decline requires a reason.
- [ ] Waitlist requires position or expected date.
- [ ] Plan-gated messaging is blocked for ineligible plans.
- [ ] Eligible users can exchange messages.
- [ ] New message emails are sent.

## Billing Checks

- [ ] Stripe checkout works for each self-serve plan.
- [ ] Professional and Verified plans support 14-day trial.
- [ ] Annual billing applies correct discount.
- [ ] Enterprise uses Stripe custom pricing path.
- [ ] Webhooks sync subscription status.
- [ ] Server-side plan gates reflect subscription state.

## Admin Checks

- [ ] Admin can view verification queue.
- [ ] Admin can approve, reject, or request more information.
- [ ] Admin can review flags.
- [ ] Admin can suspend profiles.
- [ ] Admin can view platform-level metrics.
- [ ] Admin can inspect public leads and referrals for support.

## Email Checks

- [ ] Lead submitted email sends.
- [ ] New referral email sends.
- [ ] Referral status changed email sends.
- [ ] New message email sends.
- [ ] Email templates render correctly on mobile and desktop clients.

## Release Checks

- [ ] Seed data exists for demo and beta testing.
- [ ] Error logging is configured.
- [ ] Analytics events are defined for onboarding completion, profile publish, lead submitted, referral submitted, and referral accepted.
- [ ] Legal/compliance review is completed before real referrals are accepted.
- [ ] Beta support process is documented.

