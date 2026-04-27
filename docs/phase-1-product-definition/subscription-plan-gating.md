# Subscription Plan Gating Matrix

Subscription checks must be enforced server-side.

## Referent Plans

| Feature | Starter | Professional | Enterprise |
|---|---:|---:|---:|
| Search and browse | Yes | Yes | Yes |
| Submit referrals | Yes | Yes | Yes |
| Favorites | Yes | Yes | Yes |
| Referral history | 90 days | Unlimited | Unlimited |
| Referral status tracking | No | Yes | Yes |
| In-app messaging | No | Yes | Yes |
| Saved searches | No | Beta nice-to-have | Beta nice-to-have |
| Bed availability alerts | No | Beta nice-to-have | Beta nice-to-have |
| Team members | Up to 3 | Up to 15 | Unlimited |
| Outcome reporting | No | Post-MVP basic | Post-MVP advanced |
| EHR/API integration | No | No | Post-MVP |
| SSO/SAML | No | No | Post-MVP |
| Billing | Stripe | Stripe | Stripe custom pricing |

## Aftercare Plans

| Feature | Basic | Verified | Network |
|---|---:|---:|---:|
| Search visibility | Yes | Yes | Yes |
| Published profiles | 1 | Up to 5 | Unlimited |
| Receive public leads | Yes | Yes | Yes |
| Receive referral emails | Yes | Yes | Yes |
| Referral inbox and status | No | Yes | Yes |
| In-app messaging | No | Yes | Yes |
| Sober Living live bed management | No | Yes | Yes |
| Continued Care availability toggle | No | Yes | Yes |
| Managers | Up to 2 | Up to 10 | Unlimited |
| Certification badge display | No | Yes | Yes |
| Verification tier eligibility | Tier 1 | Tier 2 | Tier 3 |
| Linked IOP/PHP profiles | No | Yes | Yes |
| Waitlist management | No | Beta nice-to-have | Beta nice-to-have |
| Analytics dashboard | No | Beta nice-to-have | Beta nice-to-have |
| Featured search placement | No | No | Yes |

## Universal Billing Rules

- Monthly and annual billing are supported.
- Annual billing gives two months free.
- Professional and Verified plans support a 14-day free trial.
- Additional homes above Verified limits are billed as add-ons.
- Additional seats above plan limits are billed as add-ons.
- No per-referral or per-placement fees are allowed.
- Stripe webhooks are the source of truth for subscription status in the app database.

