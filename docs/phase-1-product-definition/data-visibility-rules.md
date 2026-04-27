# Public And Private Data Visibility Rules

## Address Visibility

| Data | Public Visitor | Referent User | Aftercare Own Org | System Admin |
|---|---:|---:|---:|---:|
| City | Yes | Yes | Yes | Yes |
| State | Yes | Yes | Yes | Yes |
| Zip | No by default | No by default | Yes | Yes |
| Street address | No | No | Yes | Yes |
| Geocoded location | Internal only | Internal only | Yes | Yes |
| Map display | City-level only | City-level only | Exact optional internally | Admin operational view |

Rules:

- Exact addresses are never shown to public users or referents.
- Search can use exact coordinates internally without exposing them.
- Public maps should use city-level display or intentionally blurred/approximate coordinates.

## Referral Data Visibility

| Data | Public Visitor | Referent Own Org | Aftercare Recipient Org | System Admin |
|---|---:|---:|---:|---:|
| Referral summary | No | Yes | Yes | Yes |
| Case manager info | No | Yes | Yes | Yes |
| De-identified client details | No | Yes | Yes | Yes |
| Patient direct identifiers | Not collected | Not collected | Not collected | Not collected |
| Referral messages | No | Participants only | Participants only | Yes |

Rules:

- Referral forms must not collect patient name, DOB, phone, email, direct address, or medical record number.
- Referral access is scoped to participating organizations.

## Lead Data Visibility

| Data | Public Visitor | Referent User | Aftercare Recipient Org | System Admin |
|---|---:|---:|---:|---:|
| Lead created from public contact form | Submit only | No | Yes | Yes |
| Lead name/email/message | Submit only | No | Yes | Yes |
| Lead handling status | No | No | Yes | Yes |

Rules:

- Public leads do not create referral records.
- Public leads may contain sender-provided contact details, so they must not be shown outside the recipient aftercare organization and system admins.

## Verification Document Visibility

| Data | Public Visitor | Referent User | Aftercare Own Org | System Admin |
|---|---:|---:|---:|---:|
| Verification tier | Yes | Yes | Yes | Yes |
| Certification badge status | Yes | Yes | Yes | Yes |
| Uploaded documents | No | No | Yes | Yes |
| Ownership disclosure | No | No | Admin-only within org | Yes |
| Internal admin notes | No | No | No | Yes |

Rules:

- Private documents must be stored in a private bucket.
- Public views can show verification outcomes but not underlying private documents.

