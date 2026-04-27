# Role And Permission Matrix

Reviews and ratings are intentionally removed from v1.

| Capability | Public | Referent Manager | Referent Admin | Aftercare Manager | Aftercare Admin | System Admin |
|---|---:|---:|---:|---:|---:|---:|
| Search published profiles | Yes | Yes | Yes | Yes | Yes | Yes |
| View public profile details | Yes | Yes | Yes | Yes | Yes | Yes |
| View exact street address | No | No | No | Assigned only | Own org only | Yes |
| Submit generic contact form | Yes | No | No | No | No | No |
| Create internal lead | Via form | No | No | No | No | Yes |
| View leads | No | No | No | Assigned only | Own org only | Yes |
| Submit referral | No | Yes | Yes | No | No | No |
| Track own org referrals | No | Yes | Yes | No | No | Yes |
| Receive referrals | No | No | No | Assigned only | Own org only | Yes |
| Change referral status | No | No | No | Assigned only | Own org only | Yes |
| Send referral messages | No | Plan-gated | Plan-gated | Plan-gated | Plan-gated | Yes |
| Favorite profiles | No | Yes | Yes | No | No | No |
| Save searches | No | Plan-gated | Plan-gated | No | No | No |
| Manage Sober Living beds | No | No | No | Assigned only | Own org only | Yes |
| Manage Continued Care availability | No | No | No | Assigned only | Own org only | Yes |
| Manage profile content | No | No | No | Assigned only | Own org only | Yes |
| Publish or unpublish profile | No | No | No | No | Own org only | Yes |
| Upload verification documents | No | No | No | Assigned only | Own org only | Yes |
| Review verification documents | No | No | No | No | No | Yes |
| Manage team | No | No | Own org only | No | Own org only | Yes |
| Manage subscription | No | No | Own org only | No | Own org only | Yes |
| Submit flags/reports | No | Yes | Yes | No | No | Yes |
| Review flags/reports | No | No | No | No | No | Yes |
| Access reviews/ratings | No | No | No | No | No | No |

## Role Enforcement Rules

- Protected routes must enforce role checks server-side.
- API routes and server actions must enforce organization ownership.
- Aftercare Managers can access only assigned profiles.
- Referent users can access only their organization referrals.
- System Admin access must be explicit; no organization role should imply system access.
- User email uniqueness across organizations must be enforced at invite and signup.

