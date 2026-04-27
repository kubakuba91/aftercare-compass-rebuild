# Data Model Delta List

This document lists changes from the original PRD data model needed for the locked v1 scope.

## Remove From V1

### Review

Do not implement a `Review` model in v1.

Remove all related concepts:

- `response_time_rating`
- `listing_accuracy_rating`
- `would_refer_again`
- review comments
- review visibility
- review dashboard
- highest-rated search sorting
- review eligibility after `placed`

## Add To V1

### Lead

Purpose: store public generic contact form submissions.

Suggested fields:

```text
lead_id
profile_id
aftercare_org_id
name
email
phone optional
message
source (public_profile_contact)
status (new | contacted | closed | spam)
created_at
updated_at
handled_by_user_id optional
handled_at optional
```

Rules:

- Created only by public generic contact form in v1.
- Does not create a referral record.
- Sends email to the profile admissions contact.
- Visible to assigned aftercare users, aftercare admins, and system admins.

### Continued Care Availability

Add fields to `AftercareProfile` for `profile_type = continued_care`:

```text
accepting_new_patients boolean
accepting_new_patients_updated_at datetime
next_available_date optional datetime
availability_notes optional text
```

Rules:

- Public and referent-facing views may display accepting/not accepting and optional next available date.
- Exact operational notes can be limited to aftercare/admin views if needed.

### Address Privacy

Store exact addresses for operational and verification use, but expose only derived public location fields:

```text
public_city
public_state
public_zip_prefix optional
location_point geography(point)
```

Rules:

- Public and referent-facing pages show city/state only.
- Search may use exact geocoded coordinates internally.
- Exact street address is visible only to authorized aftercare org users and system admins.

### User Organization Constraint

Enforce one organization per email:

```text
user.email unique
user.org_id required after onboarding
```

Rules:

- Invites fail if the email is already linked to any organization.
- Signup cannot create a second organization for an existing email.

## Adjust Existing Models

### AftercareProfile

Keep shared profile fields for both Sober Living and Continued Care, but availability differs by profile type:

- Sober Living uses bed counts and bed availability.
- Continued Care uses accepting-new-patients fields.

### Referral

Keep referral fields de-identified.

Do not add:

- patient name
- patient DOB
- patient email
- patient phone
- full address
- medical record number

### Message

Keep one message thread per referral.

Rules:

- Messages are plan-gated.
- Message participants must be tied to the referent org or aftercare org involved in the referral.

### VerificationRecord

Keep verification records for Tier 1, Tier 2, and Tier 3 workflows.

Certification expiry automation is beta nice-to-have but should be supported by the schema from the start.

