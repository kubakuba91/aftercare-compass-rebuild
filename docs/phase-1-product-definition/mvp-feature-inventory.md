# MVP Feature Inventory

## MVP Required

| Area | Feature | Required Behavior |
|---|---|---|
| Auth | Clerk sign-up/sign-in | Email verification is a hard gate before onboarding continues. |
| Auth | One organization per email | A user email cannot be invited into or create a second organization. |
| Onboarding | Account type selection | User selects Referent, Sober Living, or Continued Care. |
| Onboarding | Referent flow | Capture organization, referral context, subscription, and team setup basics. |
| Onboarding | Sober Living flow | Capture profile, beds, certifications, medication policy, services, financials, media, plan, publish/draft. |
| Onboarding | Continued Care flow | Capture profile, clinical details, intake/referral info, affiliations, media, plan, publish/draft. |
| Profiles | Draft and published states | Draft profiles are private; published profiles appear in search. |
| Profiles | Privacy-safe location | Public and referent-facing pages show city/state, not exact address. |
| Profiles | Photo uploads | At least one photo is required to publish. |
| Profiles | Video URLs | Store YouTube/Vimeo or equivalent URLs only. No uploaded video hosting. |
| Availability | Sober Living beds | Track total beds and available beds. |
| Availability | Continued Care availability | Track accepting new patients versus not accepting patients. |
| Search | Public search | Search by city, state, or zip for Sober Living and Continued Care. |
| Search | Filters | Population, specialty populations, price, insurance, amenities, MAT, certification, verification tier, and availability. |
| Search | Sort | Relevance, price, distance, and availability. No highest-rated sort. |
| Public Leads | Generic contact form | Creates internal `Lead` record and sends email via Resend. |
| Referrals | Referral form | Logged-in referents submit de-identified referrals. |
| Referrals | Status lifecycle | Supports pending, viewed, accepted, declined, waitlisted, placed, and closed. |
| Messaging | Referral thread | Available only for eligible subscription tiers. |
| Dashboards | Referent dashboard | Overview, referrals, favorites, team basics, subscription, account settings. |
| Dashboards | Aftercare dashboard | Overview, referral inbox, profiles, availability, documents, subscription, account settings. |
| Dashboards | System Admin dashboard | Verification queue, flags, users, subscriptions, and platform metrics. |
| Verification | Document review | Admin can approve, reject, or request more information. |
| Billing | Stripe subscriptions | Plans, trials, annual billing, add-ons, custom Enterprise pricing, webhook sync. |
| Notifications | Transactional emails | Leads, new referrals, status changes, and new messages. |

## Beta Nice-To-Have

| Area | Feature | Notes |
|---|---|---|
| Search | Saved searches | Professional+ referent plans. |
| Search | Bed alerts | Notify when matching availability appears. |
| Referrals | Waitlist management | Reorder waitlist and notify referents when availability changes. |
| Analytics | Dashboard analytics | Trend and conversion reporting beyond core metric cards. |
| Verification | Expiry automation | 60/30/7 day alerts and auto-downgrade. |
| Teams | Advanced invites | More polished invitation and reassignment flows. |
| Search | Map view | Add once list search is stable. |

## Explicitly Out Of V1

| Area | Excluded Feature |
|---|---|
| Trust | Reviews, ratings, comments, highest-rated sorting, review dashboard. |
| Enterprise | SSO/SAML. |
| Integrations | EHR/API integrations. |
| Analytics | Outcome reporting and advanced analytics. |
| Mobile | Native mobile app. |
| Search | Algolia/full-text search service. |
| Media | Uploaded video hosting/transcoding. |
| User Type | Patient self-search mode. |

