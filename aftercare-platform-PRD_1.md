# Aftercare Placement Platform — Product Requirements Document

> Version 1.0 | Status: Draft  
> A marketplace connecting Referent organizations (inpatient/outpatient programs) with Aftercare programs (sober living homes and continued care/IOP programs).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Onboarding & Account Creation](#3-onboarding--account-creation)
4. [Data Models](#4-data-models)
5. [Home & Program Profile Pages](#5-home--program-profile-pages)
6. [Search & Discovery](#6-search--discovery)
7. [Referral System](#7-referral-system)
8. [Dashboards](#8-dashboards)
9. [Verification & Trust System](#9-verification--trust-system)
10. [Pricing & Subscription](#10-pricing--subscription)
11. [Notifications](#11-notifications)
12. [Tech Stack](#12-tech-stack)
13. [Technical Notes](#13-technical-notes)

---

## 1. Product Overview

An Airbnb-style marketplace for behavioral health aftercare placement. Referent organizations (hospitals, inpatient centers, crisis centers, RTCs, community orgs) use the platform to find, evaluate, and refer patients to Aftercare programs (sober living homes, IOPs, PHPs, continued care programs).

**Core value props:**
- Transparency into aftercare program quality, availability, and certifications
- Structured referral workflow replacing phone/fax/spreadsheet processes
- Trust layer via tiered verification and B2B peer reviews
- Real-time bed availability

**Two sides of the marketplace:**
- **Supply:** Aftercare programs (sober living homes, continued care/IOP programs)
- **Demand:** Referent organizations placing patients

---

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

| Role | Scope | Description |
|---|---|---|
| System Admin | Platform-wide | Oversees entire platform, manages global settings, users, compliance, and verification reviews |
| Referent Admin | Organization | Manages their referring org account, users, subscription, and settings |
| Referent Manager | Organization | Searches for placements, submits referrals, tracks status, communicates with aftercare |
| Aftercare Admin | Organization | Manages their aftercare org, homes/programs, managers, subscription |
| Aftercare Manager | Home/Program | Manages daily operations for assigned homes — bed availability, referral inbox, messaging |
| Public / Unauthenticated | Platform | Can search and browse profiles; sees generic contact form only |

### 2.2 Permission Matrix

| Feature | Public | Referent Manager | Referent Admin | Aftercare Manager | Aftercare Admin | System Admin |
|---|---|---|---|---|---|---|
| Search & browse profiles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View full profile details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Generic contact form | ✓ | — | — | — | — | — |
| Full referral contact form | — | ✓ | ✓ | — | — | — |
| Submit referrals | — | ✓ | ✓ | — | — | — |
| Track referral status | — | ✓ | ✓ | — | — | — |
| Receive referrals | — | — | — | ✓ | ✓ | — |
| Manage bed availability | — | — | — | ✓ | ✓ | — |
| Manage home profile | — | — | — | ✓ | ✓ | — |
| Leave placement reviews | — | ✓ | ✓ | — | — | — |
| Invite team members | — | — | ✓ | — | ✓ | — |
| Manage subscription | — | — | ✓ | — | ✓ | — |
| Verify listings | — | — | — | — | — | ✓ |
| Review flagged content | — | — | — | — | — | ✓ |

---

## 3. Onboarding & Account Creation

### 3.1 Account Type Selection (All Users)

First screen after "Create Account" — user selects their account type:

- **I refer patients** — I am part of a Hospital, Inpatient Center, Crisis Center, Residential Treatment Center, Community Outreach Org, or similar
- **I manage a Sober Living Home**
- **I manage a Continued Care Program** (IOP, PHP, Outpatient)

Selection routes to the appropriate onboarding flow below.

---

### 3.2 Referent Organization Onboarding

**Flow rules:**
- Admin creates org first, then invites team members
- Email verification is a hard gate — must verify before proceeding past Step 1
- Plan selection happens at the end, before account activation

#### Step 1 — Admin account + email verification
- First name, last name `required`
- Work email `required`
- Password + confirm password `required`
- → Send verification email → hard gate until verified

#### Step 2 — Organization details
- Organization name `required`
- Organization type `required` _(dropdown: Hospital / Health System, Inpatient Residential Treatment Center, Partial Hospitalization Program (PHP), Intensive Outpatient Program (IOP), Crisis Stabilization Center, Community Mental Health Center, Community Outreach Organization, Other)_
- Primary address (street, city, state, zip) `required`
- Main phone number `required`
- Medical records fax number
- Website URL
- Health system affiliation _(text field — e.g. "Jefferson Health", "UPMC")_
- NPI number or state license number _(trust signal for verification)_
- EHR system in use _(dropdown: Epic, Cerner, Athena, eClinicalWorks, Other, None)_
- States operated in _(multi-select — for multi-state orgs)_

#### Step 3 — Level of care & referral context
- Level of care provided `required` _(multi-select: Detox, Residential (RTC), Partial Hospitalization (PHP), Intensive Outpatient (IOP), Outpatient, Crisis Stabilization, Community Outreach)_
- How do you currently place patients? _(multi-select: Phone calls, Fax, Email, Spreadsheet, EHR referral module, Other)_ — onboarding empathy/research question
- Average number of patients referred to aftercare per month _(dropdown: 1–5, 6–15, 16–30, 30+)_

#### Step 4 — Plan selection
- Display Referent plan options: Starter ($99/mo), Professional ($299/mo), Enterprise (custom)
- Highlight recommended plan based on team size / volume answers
- Option to start with annual billing (2 months free)
- Payment details entry
- 14-day free trial offered on Professional

#### Step 5 — Invite team members (or skip)
- Enter email addresses for team members
- Assign role: Referent Manager or Referent Admin
- Skip option — "I'll do this from my dashboard"

#### Step 6 — Confirmation & dashboard redirect
- Account activated
- Welcome checklist shown: Complete org profile, Invite team, Make your first search

---

### 3.3 Sober Living Program Onboarding

**Flow rules:**
- Email verification is a hard gate after Step 1
- Progress saves at stage boundaries — user can return and resume
- Plan selection happens at the end
- Profile can be published at Tier 1 (self-reported) before verification is complete
- "Save & continue later" button available at each stage boundary

#### Step 1 — Account basics + email verification
- First name, last name `required`
- Work email `required`
- Password + confirm password `required`
- Role at organization `required` _(dropdown: Owner, Executive Director, Program Director, House Manager, Other)_
- → Send verification email → hard gate

#### Step 2 — Organization details
- Program / organization name `required`
- Primary business address `required` _(street, city, state, zip)_
- Additional locations? _(Y/N — if yes, add additional addresses)_
- Admissions contact phone `required`
- Admissions contact email `required`
- Website URL
- Ownership disclosure `required` _(full legal name of owner(s) — stored privately, used for verification)_
- Business registration / EIN _(upload field — PDF or image)_

#### Step 3 — Population & beds
- Population served `required` _(select: Men, Women, Both, LGBTQ+)_
- Specialty populations served _(multi-select: First Responders / Veterans, Professionals, Young Adults (18–25), Seniors (55+), None)_
- Total beds `required` _(number field)_
- Beds by gender breakdown `required` _(Men: ___, Women: ___, LGBTQ+: ___ — must sum to total beds, real-time validation)_
- Private vs shared rooms _(multi-select: Private, Double occupancy, Triple occupancy, Dormitory)_
- Beds reserved for specific populations _(optional text — e.g. "4 beds reserved for First Responders")_
- Wheelchair accessible beds _(Y/N — if yes: how many?)_
- Average length of stay _(dropdown: 30 days, 60 days, 90 days, 6 months, 9 months, 12 months, Flexible)_

#### Step 4 — Certifications & compliance
- Accreditations / certifications held _(multi-select with individual upload per cert: NARR Level 1, NARR Level 2, NARR Level 3, Sober Living Network (SLN), Minnesota Association of Sober Homes (MASH), The Joint Commission, CARF, Oxford House, State-specific license)_
- For each selected cert: upload certificate + expiration date
- State operating license _(upload field + expiration date)_
- Liability insurance certificate _(upload field + expiration date)_
- Good Neighbor Policy acknowledgment _(checkbox)_
- Drug testing policy _(dropdown: Daily, Random, Weekly, Upon suspicion, Not conducted)_

#### Step 5 — Medication policy
- Medication administration _(select: Self-administered only, Staff-assisted, Both)_
- Lockbox provided _(Y/N)_
- MAT (Medication-Assisted Treatment) options accepted _(multi-select: Suboxone/Buprenorphine, Vivitrol/Naltrexone, Methadone, All MAT accepted, No MAT accepted)_
- Medication restrictions _(free text — e.g. "No methadone. Suboxone accepted with prescription.")_

#### Step 6 — Support services & amenities
- Support services offered _(multi-select with ability to add custom: 12-Step Meetings, AA/NA on-site, Case Management, Clinician on staff, Legal Support, Life Skills Training, Vocational Support, Transportation Assistance, Peer Support Specialist, Mental Health Services, Trauma-Informed Care)_
- Amenities _(multi-select with ability to add custom: High-Speed WiFi, Memory Foam Mattress, Overnight Passes, Pet Friendly, Multiple Refrigerators, Public Transportation Access, In-unit Laundry, Gym/Fitness Access, Private Bathroom, Outdoor Space, TV in room, Parking)_
- Insurance accepted _(multi-select: Medicaid, Medicare, Commercial Insurance, Private Pay / Self-Pay, Sliding Scale)_
- Funding available _(Y/N — if yes, describe briefly)_

#### Step 7 — Program details
- Price per week `required` _(number field — USD)_
- Description of the home `required` _(textarea — what makes this home unique, philosophy, environment)_
- House rules _(textarea or upload PDF)_
- Linked IOP / PHP profile _(search field — link to a Continued Care program on the platform)_
- Preferred contact method _(dropdown: Phone, Email, In-app message, Any)_

#### Step 8 — Media
- Photos _(upload — min 1 required to publish, max 20. Accepted: JPG, PNG. Recommended: exterior, common areas, bedrooms, kitchen)_
- Videos _(optional — upload or YouTube/Vimeo URL, max 3)_

#### Step 9 — Plan selection
- Display Aftercare plan options: Basic ($149/mo), Verified ($349/mo), Network ($699/mo)
- Recommend plan based on number of homes entered
- Annual billing option (2 months free)
- 14-day free trial offered

#### Step 10 — Publish or save as draft
- Option A: **Publish now** — profile goes live at Tier 1 (self-reported). Verification badge will be added after document review.
- Option B: **Save as draft** — profile saved, not visible in search until published
- Confirmation screen with link to dashboard and verification status tracker

---

### 3.4 Continued Care Program Onboarding (IOP / PHP / OP)

**Flow rules:** Same save/resume and email verification rules as Sober Living.

#### Step 1 — Account basics + email verification
- First name, last name `required`
- Work email `required`
- Password + confirm password `required`
- Role at organization `required`
- → Email verification hard gate

#### Step 2 — Organization details
- Program name `required`
- Program type `required` _(multi-select: Partial Hospitalization Program (PHP), Intensive Outpatient Program (IOP), Standard Outpatient (OP), MAT Clinic, Dual Diagnosis Program)_
- Primary address `required`
- Telehealth available _(Y/N — if yes: telehealth only, or hybrid?)_
- Additional locations _(optional)_
- State license number `required`
- Accreditations _(multi-select with upload: CARF, The Joint Commission, NARR, State-specific)_
- Ownership / business registration _(upload)_

#### Step 3 — Clinical details
- Levels of care offered `required` _(multi-select: PHP, IOP, OP — can offer multiple)_
- Hours of operation `required` _(e.g. Mon–Fri 9am–3pm)_
- Population served `required` _(Men, Women, Both, LGBTQ+)_
- Specialty populations _(multi-select: First Responders / Veterans, Professionals, Young Adults, Co-occurring Mental Health, Eating Disorders)_
- MAT services offered _(Y/N — if yes, which: Suboxone, Vivitrol, Methadone)_
- Co-occurring mental health treatment _(Y/N)_
- Average program duration _(dropdown: 30 days, 30–60 days, 60–90 days, 90+ days, Ongoing / as needed)_

#### Step 4 — Intake & referral
- Intake contact name `required`
- Intake contact phone `required`
- Intake contact email `required`
- Insurance accepted _(multi-select: Medicaid, Medicare, Commercial, Self-Pay, Sliding Scale)_
- Referral process description _(textarea — what referents need to send: e.g. "Fax clinical summary + insurance card to...")_
- Medical records fax number

#### Step 5 — Partnerships & description
- Affiliated sober living homes _(search field — link to Sober Living profiles on the platform)_
- Description of program `required` _(philosophy, approach, what makes this program distinctive)_
- Support services _(multi-select: same options as Sober Living)_
- Preferred contact method

#### Step 6 — Media
- Photos _(upload, min 1 to publish, max 20)_
- Videos _(optional)_

#### Step 7 — Plan selection
- Same Aftercare plan options as Sober Living onboarding

#### Step 8 — Publish or save as draft
- Same options as Sober Living onboarding

---

## 4. Data Models

### 4.1 User

```
user_id
email (unique)
password_hash
first_name
last_name
role (system_admin | referent_admin | referent_manager | aftercare_admin | aftercare_manager)
org_id (FK → Organization)
email_verified (boolean)
email_verified_at
created_at
last_login_at
is_active
```

### 4.2 Organization

```
org_id
org_type (referent | aftercare_sober_living | aftercare_continued_care)
name
primary_address (street, city, state, zip, lat, lng)
phone
email
website
subscription_plan
subscription_status
subscription_billing_cycle (monthly | annual)
subscription_renews_at
created_at
```

### 4.3 Referent Organization (extends Organization)

```
referent_org_id
org_type_detail (Hospital | Health System | RTC | PHP | IOP | Crisis | Community | Other)
health_system_affiliation
medical_records_fax
npi_number
state_license_number
ehr_system
states_operated_in (array)
levels_of_care (array)
avg_monthly_referrals
```

### 4.4 Aftercare Home / Program Profile

```
profile_id
org_id (FK → Organization)
profile_type (sober_living | continued_care)
program_name
slug (URL-friendly unique identifier)
status (draft | published | suspended | under_review)
verification_tier (1 | 2 | 3)

-- Location
main_address (street, city, state, zip, lat, lng)
additional_addresses (array of address objects)

-- Contact
admissions_contact_phone
admissions_contact_email
preferred_contact_method

-- Population
population_served (men | women | both | lgbtq)
specialty_populations (array)

-- Beds (Sober Living)
total_beds
beds_men
beds_women
beds_lgbtq
beds_available (live field — updated by manager)
beds_available_updated_at
private_rooms
shared_rooms (double | triple | dormitory)
beds_reserved_notes
wheelchair_accessible_beds

-- Financials
price_per_week
funding_available (boolean)
funding_notes
insurance_accepted (array)

-- Certifications
certifications (array of { cert_name, cert_body, issued_date, expiry_date, document_url, status: active|expired|pending })
state_license_number
state_license_expiry
state_license_doc_url

-- Clinical (Continued Care)
program_types (array: php | iop | op | mat | dual_diagnosis)
hours_of_operation
telehealth_available
telehealth_type (only | hybrid)
mat_offered
mat_options (array)
co_occurring_treatment
avg_program_duration

-- Services & amenities
support_services (array)
amenities (array)

-- Medication (Sober Living)
medication_administration (self | staff | both)
lockbox_provided
mat_accepted (array)
medication_restrictions_notes

-- Content
description
house_rules
photos (array of URLs)
videos (array of URLs)
linked_iop_profile_id (FK → profile_id)
linked_sober_living_ids (array of FK)

-- Metadata
created_at
updated_at
published_at
```

### 4.5 Referral

```
referral_id
referent_user_id (FK → User)
referent_org_id (FK → Organization)
aftercare_profile_id (FK → Profile)

-- Case manager info
cm_name
cm_email
cm_phone
cm_organization

-- Client details (de-identified)
client_age_range
support_category (substance_use | mental_health | co_occurring | other)
insurance_category (medicaid | medicare | commercial | self_pay)
preferred_start_window (within_1_week | 1_2_weeks | 2_4_weeks | flexible)
special_needs (array: mat_friendly | gender_specific | twelve_step | pet_friendly | other)
reason_for_referral (text)

-- Status
status (pending | viewed | accepted | declined | waitlisted | placed | closed)
status_updated_at
waitlist_position
expected_availability_date
decline_reason

-- Messaging thread
messages (array — see Message model)

created_at
updated_at
```

### 4.6 Message

```
message_id
referral_id (FK → Referral)
sender_user_id (FK → User)
sender_role
body (text)
read_at
created_at
```

### 4.7 Verification Record

```
verification_id
profile_id (FK → Profile)
tier_achieved (1 | 2 | 3)
reviewed_by_user_id (FK → System Admin User)
reviewed_at
documents_submitted (array of { doc_type, url, submitted_at, status: pending|approved|rejected })
notes (admin internal notes)
next_review_due
```

### 4.8 Review

```
review_id
profile_id (FK → Profile)
reviewer_org_id (FK → Referent Organization)
reviewer_user_id (FK → User)
referral_id (FK → Referral — must have a completed placement to review)
response_time_rating (1–5)
listing_accuracy_rating (1–5)
would_refer_again (boolean)
comment (text, optional)
is_visible (boolean — visible to verified orgs only)
created_at
```

### 4.9 Flag / Report

```
flag_id
profile_id (FK → Profile)
reported_by_user_id (FK → User)
flag_type (solicitation | insurance_fraud | misrepresented_beds | unlicensed | patient_harm | kickback | discrimination | other)
description (text)
status (open | under_review | resolved_action_taken | resolved_no_action)
resolved_by_user_id
resolved_at
created_at
```

---

## 5. Home & Program Profile Pages

### 5.1 Public Profile — Sober Living Home

Displayed to all visitors. Sections:

**Header**
- Program name
- Verification tier badge (Tier 1 / Verified / Certified)
- Certification badges (NARR level, CARF, Joint Commission, etc.) with active/expired status
- City, State
- Population served tags
- Bed availability indicator (Available / Full / Waitlist)
- Price per week
- "Contact this home" CTA button

**Photo gallery**
- Full-width photo carousel (exterior, common areas, bedrooms, kitchen)

**Overview**
- Description
- Population served
- Specialty populations
- Average length of stay
- Total beds / available beds

**Certifications & compliance**
- Each cert listed with status badge (active / expired / pending)
- State license status
- Last verification date

**Support services**
- Tag list

**Amenities**
- Tag list

**Medication policy**
- MAT accepted / not accepted
- Lockbox available
- Self-administered / staff-assisted

**Insurance & financials**
- Insurance types accepted
- Weekly rate
- Funding available

**Linked programs**
- Card linking to associated IOP/PHP profiles

**Location**
- Map embed (city-level for privacy — not exact street address for public view)

**Contact section**
- If logged in (Referent): Full referral contact form (see Section 7)
- If not logged in: Generic contact form (Name, Email, Message) — delivered to home's email

### 5.2 Public Profile — Continued Care / IOP Program

Same structure as above with these differences:
- Program types shown (PHP / IOP / OP)
- Hours of operation
- Telehealth availability
- Co-occurring treatment indicator
- MAT services offered
- Referral process description
- Linked sober living homes

---

## 6. Search & Discovery

### 6.1 Search Entry

Users can search for:
- Sober Living Home
- Continued Care Program (IOP/PHP)

Search by city, state, or zip code.

### 6.2 Search Results

**Result card shows:**
- Program name
- Verification tier badge
- City, State
- Population served
- Price per week
- Beds available indicator (Available / Full / Waitlist)
- Top 3 certification badges
- "Favorite" toggle (logged-in users)

**Sort options:**
- Relevance (default)
- Price: low to high / high to low
- Distance
- Availability (open beds first)
- Highest rated (verified orgs only)

**View toggle:** List view / Map view

### 6.3 Search Filters

- Population served _(Men, Women, Both, LGBTQ+)_
- Specialty populations _(multi-select: First Responders/Veterans, Professionals, Young Adults)_
- Price per week _(min–max range slider)_
- Average program duration _(3 months, 3–6 months, 6–9 months, 9–12 months)_
- Insurance accepted _(multi-select)_
- Amenities _(multi-select)_
- MAT-friendly _(Y/N toggle)_
- Medication restrictions _(No MAT, MAT accepted, Suboxone only, etc.)_
- Certification held _(multi-select: NARR, CARF, Joint Commission, etc.)_
- Verification tier _(Tier 1 / Verified / Certified)_
- Beds available now _(toggle)_

### 6.4 Saved Search & Alerts

Available on Professional and above (Referent plans):
- Save a search with all active filters
- Set alert: notify me when a matching bed becomes available
- Alert delivered via email + in-app notification

---

## 7. Referral System

### 7.1 Referral Contact Form (Logged-in Referent Users)

Shown on profile page instead of generic contact form. Submitted to aftercare home's account email + referral inbox.

**Case manager information**
- Case manager name `required`
- Case manager email `required`
- Case manager phone `required`
- Organization name `required`

**Client details** (de-identified — no names)
- Age range _(dropdown: 18–25, 26–35, 36–45, 46–55, 55+)_
- General support category `required` _(dropdown: Substance Use Recovery, Mental Health Support, Co-Occurring Support, Other)_
- Insurance category `required` _(dropdown: Medicaid, Medicare, Commercial Insurance, Self-Pay)_
- Preferred start window `required` _(dropdown: Within 1 week, 1–2 weeks, 2–4 weeks, Flexible)_
- Special needs / preferences _(checkboxes: MAT-Friendly, Gender-Specific Housing, 12-Step-Oriented, Pet Friendly, Wheelchair Accessible, Other)_
- Reason for referral `required` _(textarea — e.g. "Client is transitioning from 28-day inpatient treatment and requires structured sober living with peer support.")_

**Submission**
- On submit: referral created with status `pending`
- Confirmation shown to referent with referral ID
- Email sent to aftercare home's admissions contact
- Referral appears in both Referent and Aftercare dashboards

### 7.2 Referral Status Lifecycle

```
pending → viewed → accepted | declined | waitlisted
waitlisted → accepted | declined
accepted → placed | closed
any → closed
```

**Status definitions:**
- `pending` — submitted, not yet viewed by aftercare
- `viewed` — aftercare opened the referral
- `accepted` — aftercare confirmed a bed is available
- `declined` — aftercare cannot accept (reason provided)
- `waitlisted` — no bed now; client added to waitlist (position + expected date shown)
- `placed` — client has moved in / started program
- `closed` — referral ended for any reason

### 7.3 In-App Messaging

Available on Professional+ (Referent) and Verified+ (Aftercare) plans.

- Threaded message per referral
- Both parties can send messages
- Email notification on new message
- Read receipts shown

### 7.4 Generic Contact Form (Public / Not Logged In)

- Name
- Email
- Message
- Delivered to aftercare home's account email only
- No referral record created

---

## 8. Dashboards

### 8.1 Referent Organization Dashboard

**Overview tab**
- Metric cards: Active referrals, Referrals this month, Placement rate, Avg. response time from aftercare homes
- Recent referral activity feed

**Referrals tab**
- List of all referrals submitted by org
- Columns: Date, Home/Program name, Status, Case manager, Last updated
- Filter by: Status, Date range, Case manager
- Click to open referral detail + message thread

**Favorites tab**
- Saved home/program profiles
- Quick-view bed availability status
- CTA to start a referral

**Saved searches tab**
- Manage saved searches and bed availability alerts

**Team tab**
- List of users in org (name, email, role, last active)
- Invite new member
- Change member role
- Remove member
- Available on Professional+

**Subscription tab**
- Current plan, renewal date, billing cycle
- Upgrade / downgrade options
- Invoice history

**Account settings tab**
- Org profile details
- Notification preferences

---

### 8.2 Aftercare Program Dashboard

**Overview tab**
- Metric cards: Total beds, Beds available now, Referrals this week, Response rate, Avg. response time
- Referral activity feed

**Referral inbox tab**
- All inbound referrals
- Columns: Date received, Referred by (org name), Status, Client details summary, Last message
- Filter by: Status, Date range
- Click to open referral detail: view client info, change status, send message
- Status change actions: Mark as Viewed, Accept, Decline (with reason), Add to Waitlist

**Homes tab** _(Aftercare Admin only)_
- List of all home/program profiles under this org
- Per home: profile status, verification tier, beds total, beds available, assigned managers
- Add new home
- Edit profile

**Bed availability tab**
- Quick update for each home: Available beds count (live field)
- Toggle availability status: Open / Full / Waitlist
- Estimated availability date (when Full or Waitlist)
- Last updated timestamp

**Waitlist tab**
- Queue of waitlisted referrals per home
- Reorder waitlist
- Mark as available to notify referent

**Team tab** _(Aftercare Admin only)_
- List of managers + which homes they are assigned to
- Invite manager
- Assign/reassign homes to managers

**Reviews tab**
- Reviews received from referent orgs
- Aggregate ratings display
- Individual review cards (visible to verified orgs who look at the profile)

**Documents tab**
- Upload/manage verification documents
- Cert expiry tracker with status indicators and upcoming renewal alerts (60 / 30 / 7 days)

**Subscription tab**
- Current plan, renewal, billing
- Upgrade options

**Account settings tab**
- Org details
- Notification preferences

---

### 8.3 System Admin Dashboard

- Platform metrics: Total orgs, Active listings, Referrals submitted (all time / this month), Avg. response time platform-wide
- Verification queue: Profiles pending Tier 2 / Tier 3 review, document review tools, approve / request more info / reject
- Flagged content queue: Review reported profiles, take action (warn / suspend / remove)
- User management: Search users, impersonate for support, disable accounts
- Subscription management: View all org subscriptions, override for comps/trials
- Cert expiry monitor: All certifications expiring in next 90 days with auto-downgrade log

---

## 9. Verification & Trust System

### 9.1 Verification Tiers

**Tier 1 — Self-reported (Basic listing)**
- Email confirmed
- Profile fields completed
- No documents reviewed
- Label: "Self-reported listing" — clearly shown on profile and search results

**Tier 2 — Document verified**
- State license on file and reviewed by admin
- Business registration / EIN confirmed
- Ownership disclosure reviewed
- Physical address confirmed
- Admissions contact verified
- Label: "Verified" badge on profile and search cards

**Tier 3 — Certified & accredited**
- All Tier 2 requirements met
- Active third-party certification (NARR, CARF, Joint Commission, etc.) on file
- Certification expiry tracked — auto-downgrade to Tier 2 if cert lapses
- Last inspection date on file
- Staff credential disclosure provided
- Annual re-verification required
- Label: "Certified" badge — highest prominence in search

### 9.2 Certification Badges

Each certification listed on a profile is badged individually with its current status:
- Active (green badge)
- Pending review (gray badge)
- Expired (red badge — shown, not hidden)

Certs tracked: NARR Level 1/2/3, Sober Living Network (SLN), MASH, The Joint Commission, CARF, Oxford House, state-specific licenses.

### 9.3 Document Checklist

| Document | Required for | Notes |
|---|---|---|
| State operating license | Tier 2+ | Expiry tracked |
| Business registration / EIN | Tier 2+ | |
| Ownership disclosure form | Tier 2+ | Names kept private |
| Liability insurance certificate | Tier 2+ | Expiry tracked |
| Third-party certification | Tier 3 | Expiry tracked |
| House manager credentials | Tier 3 | |
| Drug testing policy | All tiers | |
| Good Neighbor Policy acknowledgment | All tiers | |

### 9.4 Cert Expiry Auto-Downgrade

- 60 / 30 / 7 days before expiry: email alert to Aftercare Admin
- Day of expiry: cert badge flips to "Expired" (red)
- If Tier 3 cert expires and no replacement uploaded within 30-day grace period: profile auto-downgrades to Tier 2
- System Admin notified of all auto-downgrades

### 9.5 B2B Review System

Referent Managers can leave a structured review after a placement is marked as `placed`. Reviews visible to verified referent orgs only (not public).

Rating dimensions:
- Response time (1–5 stars)
- Accuracy of listing information (1–5 stars)
- Would refer again (Y/N)
- Optional free-text comment

### 9.6 Reporting / Red Flag System

Reportable issues:
- Patient solicitation
- Insurance fraud
- Misrepresented bed counts
- Unlicensed operation
- Patient harm
- Kickback / patient brokering (Sober Home Patient Brokering Act)
- Discriminatory intake practices

Platform response workflow:
1. Report submitted → listing flagged internally (not publicly shown)
2. System Admin reviews → investigates
3. If verified: badge revoked, listing suspended or removed
4. Reporting org can track report status anonymously

---

## 10. Pricing & Subscription

### 10.1 Referent Organization Plans

| | Starter | Professional | Enterprise |
|---|---|---|---|
| Price | $99/mo | $299/mo | Custom |
| Team members | Up to 3 | Up to 15 | Unlimited |
| Search & browse | ✓ | ✓ | ✓ |
| Referral contact form | ✓ | ✓ | ✓ |
| Favorites | ✓ | ✓ | ✓ |
| Referral history | 90 days | Unlimited | Unlimited |
| In-app messaging | — | ✓ | ✓ |
| Referral status tracking | — | ✓ | ✓ |
| Saved search + bed alerts | — | ✓ | ✓ |
| Leave placement reviews | — | ✓ | ✓ |
| Outcome reporting | — | Basic | Advanced |
| EHR / API integration | — | — | ✓ |
| SSO / SAML | — | — | ✓ |
| Dedicated account manager | — | — | ✓ |

### 10.2 Aftercare Program Plans

| | Basic | Verified | Network |
|---|---|---|---|
| Price | $149/mo | $349/mo | $699/mo |
| Home profiles | 1 | Up to 5 | Unlimited |
| Appear in search | ✓ | ✓ | ✓ |
| Verification tier eligible | Tier 1 | Tier 2 | Tier 3 |
| Receive referrals (email) | ✓ | ✓ | ✓ |
| In-app messaging | — | ✓ | ✓ |
| Live bed availability mgmt | — | ✓ | ✓ |
| Referral inbox + status | — | ✓ | ✓ |
| Managers | Up to 2 | Up to 10 | Unlimited |
| Cert badge display | — | ✓ | ✓ |
| Featured search placement | — | — | ✓ |
| Waitlist management | — | — | ✓ |
| Analytics dashboard | — | — | ✓ |
| Linked IOP/PHP profiles | — | ✓ | ✓ |
| Dedicated account manager | — | — | ✓ |

### 10.3 Billing Rules

- Monthly or annual billing (annual = 2 months free)
- 14-day free trial on Professional (Referent) and Verified (Aftercare) plans
- Read-only browsing free for all unauthenticated users — referral contact form requires subscription
- Additional homes above Verified plan limit: $75/mo per home
- Additional team seats above plan limit: $15/mo per seat
- Featured search placement is Network plan only — not sold separately (no ad product)
- Flat SaaS pricing only — no per-referral or per-placement fees (legal compliance with state patient brokering laws)

---

## 11. Notifications

### 11.1 Referent User Notifications

| Event | In-app | Email |
|---|---|---|
| Referral status changed | ✓ | ✓ |
| New message on referral thread | ✓ | ✓ |
| Saved search: bed now available | ✓ | ✓ |
| Team member invited / joined | ✓ | ✓ |
| Subscription renewal upcoming | ✓ | ✓ |

### 11.2 Aftercare Manager Notifications

| Event | In-app | Email |
|---|---|---|
| New referral received | ✓ | ✓ |
| New message on referral thread | ✓ | ✓ |
| Certification expiring (60/30/7 days) | ✓ | ✓ |
| Tier auto-downgrade occurred | ✓ | ✓ |
| Verification status updated by admin | ✓ | ✓ |
| Subscription renewal upcoming | ✓ | ✓ |

### 11.3 System Admin Notifications

| Event | In-app | Email |
|---|---|---|
| New verification document submitted | ✓ | ✓ |
| New flag / report submitted | ✓ | ✓ |
| Certification auto-downgrade triggered | ✓ | — |

---

## 12. Tech Stack

### 12.1 Overview

This stack is chosen for speed to production, minimal infrastructure overhead, strong Claude Code compatibility, and the ability to scale when the platform grows. Every choice has a clear rationale tied to a specific platform requirement.

---

### 12.2 Frontend

**Framework: Next.js 14+ (App Router)**
- Rationale: SEO is critical — search result pages and home profiles need to be crawlable. Next.js server-side rendering handles this natively. App Router supports per-route layouts cleanly, which maps well to the distinct dashboard experiences (Referent vs Aftercare vs Admin).
- File-based routing maps cleanly to the platform's URL structure (see Section 12.8)

**Language: TypeScript**
- Rationale: The data models in Section 4 are complex with many inter-related types. TypeScript enforces correctness across the referral lifecycle, role-based access, and multi-tenant org structures. Strongly recommended for a project of this complexity.

**UI Component Library: shadcn/ui**
- Rationale: Unstyled, composable, copy-paste components that Claude Code handles exceptionally well. Avoid fully opinionated libraries (MUI, Chakra) that fight customization. shadcn/ui gives full control over every component.
- Install: `npx shadcn-ui@latest init`

**Styling: Tailwind CSS**
- Ships with shadcn/ui. Utility-first, no context switching between CSS files.

**Form handling: React Hook Form + Zod**
- Rationale: The onboarding flows have complex multi-step forms with conditional fields and real-time validation (e.g. bed count sum validation). React Hook Form minimizes re-renders; Zod provides schema-based validation that can be shared between frontend and backend.

**State management: Zustand**
- For multi-step onboarding form state that persists across steps, and dashboard UI state. Avoid Redux for a project this size.

---

### 12.3 Backend

**API: Next.js API Routes / Route Handlers**
- Rationale: Keeps the codebase unified in one repo. For a v1, Next.js API routes are sufficient. If the API needs to be consumed by a mobile app later (V2), extract to a standalone Express/Fastify service at that point.

**ORM: Prisma**
- Rationale: Prisma's schema file maps directly to the data models in Section 4. Claude Code generates Prisma schemas extremely well from structured PRDs. Type-safe queries, built-in migrations, excellent PostgreSQL support.
- Prisma schema will define: User, Organization, ReferentOrg, AftercareProfile, Referral, Message, VerificationRecord, Review, Flag

**Runtime: Node.js 20+**

---

### 12.4 Database

**Primary database: PostgreSQL (via Supabase)**
- Rationale: The relational structure of users → orgs → profiles → referrals → messages demands a relational DB. PostgreSQL with PostGIS extension handles the geo queries needed for location-based search without adding Algolia/Elasticsearch in v1.
- Supabase provides: hosted Postgres, built-in auth (optional), storage, realtime subscriptions, and a studio UI — all on a generous free tier for development.

**Connection: Supabase PostgreSQL connection string → Prisma**
- Use Prisma for all schema management and queries. Use Supabase as the host only.

**Geo search: PostGIS extension on Supabase**
- Enable via: `create extension if not exists postgis;`
- Store `lat` / `lng` on profiles as a PostGIS `GEOGRAPHY(POINT)` column
- Query: `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
- This handles the map view and distance sorting in search without a third-party search service in v1

**When to add Algolia (V2):** If full-text search across program descriptions, amenities, and services becomes slow at scale (>10k profiles), add Algolia with a Prisma sync hook.

---

### 12.5 Authentication

**Auth provider: Clerk**
- Rationale: Clerk handles email/password with built-in email verification (hard gate, as specified), magic links, SSO/SAML (required for Enterprise Referent plan), and organization management — all out of the box.
- Clerk's `<OrganizationSwitcher>` and multi-tenant primitives map directly to the platform's org structure (one user can belong to one org with a specific role).
- Built-in: email verification flow, password reset, session management, JWT tokens for API auth

**Role management:** Store role in Clerk's `publicMetadata` (`{ role: "referent_admin" | "referent_manager" | "aftercare_admin" | "aftercare_manager" | "system_admin" }`) and in the Prisma `User` table. Middleware checks role on every protected route.

**SSO/SAML:** Clerk Enterprise plan — activate for Enterprise Referent orgs only, gated by subscription check.

**Auth flow for this platform:**
1. User signs up → Clerk creates account → verification email sent (hard gate)
2. User verifies email → redirected to account type selection screen
3. Account type selection writes `org_type` to Clerk metadata + creates Org + User records in Prisma
4. Onboarding flow begins

---

### 12.6 File Storage

**Provider: Supabase Storage**
- Rationale: Already in the stack (same Supabase project). Handles profile photos, videos, and verification documents.
- Buckets:
  - `profile-photos` — public read, authenticated write
  - `verification-docs` — private, system admin read only
  - `house-rules` — public read, authenticated write

**Image optimization:** Use Next.js `<Image>` component with Supabase storage URLs. For production, consider Cloudflare Images or Imgix for resizing/compression of profile photos.

**Video:** Accept upload (store in Supabase Storage) or YouTube/Vimeo URL (store URL string only). Do not attempt to host/transcode video in v1.

---

### 12.7 Email

**Provider: Resend**
- Rationale: Best-in-class developer experience, generous free tier (3,000 emails/mo), React Email for templates, excellent deliverability.
- Use React Email to build templates for: email verification, referral received, referral status update, new message, cert expiry alerts, team invitation, subscription renewal.

**Installation:** `npm install resend react-email`

**Trigger emails from:** Next.js API route handlers (on referral submit, status change, etc.) and Vercel Cron Jobs (for cert expiry alerts run daily).

---

### 12.8 Payments & Subscriptions

**Provider: Stripe**
- Rationale: Industry standard. Handles monthly/annual billing, trial periods (14-day free trial), seat-based overages, plan upgrades/downgrades, and invoice history — all required by the pricing model in Section 10.

**Key Stripe concepts used:**
- `Product` + `Price` — one per plan tier (6 products total: 3 Referent + 3 Aftercare)
- `Subscription` — one per org, with `metadata.org_id` and `metadata.plan`
- `Subscription Item` — add extra seats and extra homes as metered add-ons
- `Trial period` — 14-day on Professional and Verified plans
- `Webhook` — `customer.subscription.updated`, `invoice.payment_failed`, `customer.subscription.deleted` → update `subscription_status` in Prisma

**Stripe Customer Portal:** Enable for self-serve plan changes and invoice downloads from the Subscription tab in dashboards.

---

### 12.9 Real-time (In-App Messaging & Notifications)

**Provider: Supabase Realtime**
- Rationale: Already in the stack. Supabase Realtime uses Postgres `LISTEN/NOTIFY` — subscribe to changes on the `messages` and `referrals` tables to push updates to connected clients without polling.
- Use for: new message badge count, referral status change indicator, bed availability changes on search results

**Implementation pattern:**
```typescript
// Subscribe to new messages for a referral thread
const channel = supabase
  .channel(`referral:${referralId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `referral_id=eq.${referralId}`
  }, (payload) => {
    // Update local message list
  })
  .subscribe()
```

---

### 12.10 Scheduled Jobs

**Provider: Vercel Cron Jobs**
- Rationale: Serverless, zero infrastructure, ships with Vercel deployment.
- Jobs required:
  - `cert-expiry-check` — runs daily at 8am UTC. Queries all certs with `expiry_date` within 60/30/7 days → sends alert emails. Checks for expired certs past grace period → triggers auto-downgrade.
  - `bed-availability-stale-alert` — runs weekly. Flags profiles where `beds_available_updated_at` is >7 days old → emails Aftercare Manager to update.

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/cert-expiry-check", "schedule": "0 8 * * *" },
    { "path": "/api/cron/bed-availability-stale", "schedule": "0 9 * * 1" }
  ]
}
```

---

### 12.11 Hosting & Deployment

**Frontend + API: Vercel**
- Rationale: Zero-config Next.js deployment, preview deployments per PR, edge network, Vercel Cron Jobs included.
- Environment variables: stored in Vercel project settings

**Database: Supabase (hosted PostgreSQL)**
- Development: local Supabase via `npx supabase start`
- Production: Supabase cloud project

**Recommended Vercel plan:** Pro ($20/mo) — needed for cron jobs and team collaboration.

---

### 12.12 Project Structure

```
/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth required)
│   │   ├── page.tsx              # Homepage / search
│   │   ├── search/page.tsx       # Search results
│   │   ├── homes/[slug]/page.tsx # Sober living profile
│   │   └── programs/[slug]/page.tsx # Continued care profile
│   ├── (auth)/                   # Auth routes
│   │   ├── sign-up/page.tsx
│   │   ├── sign-in/page.tsx
│   │   └── onboarding/
│   │       ├── account-type/page.tsx
│   │       ├── referent/[step]/page.tsx
│   │       ├── sober-living/[step]/page.tsx
│   │       └── continued-care/[step]/page.tsx
│   ├── dashboard/                # Protected — all authenticated users
│   │   ├── referent/             # Referent org dashboard
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── referrals/
│   │   │   ├── favorites/
│   │   │   ├── saved-searches/
│   │   │   ├── team/
│   │   │   └── subscription/
│   │   ├── aftercare/            # Aftercare dashboard
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── referrals/
│   │   │   ├── homes/
│   │   │   ├── availability/
│   │   │   ├── waitlist/
│   │   │   ├── team/
│   │   │   ├── documents/
│   │   │   └── subscription/
│   │   └── admin/                # System admin dashboard
│   │       ├── page.tsx
│   │       ├── verification/
│   │       ├── flags/
│   │       └── users/
│   └── api/                      # API route handlers
│       ├── webhooks/stripe/
│       ├── webhooks/clerk/
│       ├── referrals/
│       ├── profiles/
│       ├── search/
│       ├── messages/
│       ├── reviews/
│       ├── flags/
│       └── cron/
│           ├── cert-expiry-check/
│           └── bed-availability-stale/
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── profiles/                 # Profile page components
│   ├── search/                   # Search + filter components
│   ├── referrals/                # Referral form + status components
│   ├── onboarding/               # Onboarding step components
│   └── dashboard/                # Dashboard-specific components
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── supabase.ts               # Supabase client
│   ├── stripe.ts                 # Stripe client
│   ├── resend.ts                 # Resend client
│   └── validations/              # Zod schemas (shared frontend + backend)
│       ├── referral.ts
│       ├── profile.ts
│       └── onboarding.ts
├── middleware.ts                 # Clerk auth + role-based route protection
├── prisma/
│   └── schema.prisma             # Full data model
└── emails/                       # React Email templates
    ├── referral-received.tsx
    ├── referral-status-update.tsx
    ├── new-message.tsx
    ├── cert-expiry-alert.tsx
    └── team-invite.tsx
```

---

### 12.13 Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "@clerk/nextjs": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "stripe": "^14.0.0",
    "resend": "^3.0.0",
    "react-email": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zustand": "^4.0.0",
    "tailwindcss": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

---

### 12.14 Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/account-type

# Database (Supabase)
DATABASE_URL=                        # Prisma connection (pooled)
DIRECT_URL=                          # Prisma migrations (direct)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # Server-side only

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_REFERENT_STARTER_PRICE_ID=
STRIPE_REFERENT_PRO_PRICE_ID=
STRIPE_AFTERCARE_BASIC_PRICE_ID=
STRIPE_AFTERCARE_VERIFIED_PRICE_ID=
STRIPE_AFTERCARE_NETWORK_PRICE_ID=

# Email
RESEND_API_KEY=
EMAIL_FROM=notifications@yourdomain.com

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=         # Or Mapbox token

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CRON_SECRET=                         # Shared secret to protect cron endpoints
```

---

### 12.15 Claude Code Kickoff Prompt

Use this prompt to start your first Claude Code session:

```
I'm building a behavioral health aftercare placement marketplace — 
think Airbnb for sober living homes and IOP programs. 
The full PRD is in aftercare-platform-PRD.md. Read it completely before writing any code.

Tech stack (already decided — do not suggest alternatives):
- Next.js 14 App Router + TypeScript
- Clerk for auth
- Prisma + Supabase (PostgreSQL + PostGIS)
- Stripe for subscriptions
- Resend for email
- shadcn/ui + Tailwind
- Zustand for state
- Vercel for hosting

Start with these tasks in order:
1. Initialize the Next.js project with TypeScript and Tailwind
2. Install and configure Clerk auth with the route structure from Section 12.12 of the PRD
3. Generate the full Prisma schema from Section 4 (Data Models) of the PRD
4. Set up the Supabase project and run the initial migration
5. Create the middleware.ts for role-based route protection

Ask me before starting each numbered task so I can confirm. 
Do not proceed to task 2 until task 1 is confirmed working.
```

---

## 13. Technical Notes

### 13.1 Privacy & Compliance Notes

- Client information in referrals is de-identified (no names, DOB, or direct identifiers)
- Ownership disclosure stored privately — not surfaced publicly
- Exact street addresses shown only after login (city-level for public profiles)
- Platform does not charge per referral — flat SaaS only (patient brokering law compliance)
- Recommend legal review of platform design against applicable state laws (FL, CA, TX have specific sober home patient brokering statutes)
- HIPAA: Consult attorney on whether the de-identified referral data model is sufficient or whether a BAA is needed with orgs

### 13.2 Key Business Logic Rules

- Beds by gender (men + women + lgbtq) must always equal total beds — enforce in UI and API
- Cert expiry auto-downgrade runs daily via scheduled job
- A review can only be submitted if a referral for that profile has reached `placed` status
- Referral contact form is paywalled — unauthenticated users see generic form only
- Featured placement in search is Network plan only — not purchasable separately
- A profile cannot be published without at least 1 photo
- Aftercare managers can only access profiles assigned to their account by Aftercare Admin

### 13.3 Future Considerations (V2+)

- Patient self-search mode (someone seeking housing for themselves — separate UX from professional referral flow)
- EHR integration (Epic, Cerner) for Enterprise Referent orgs
- Outcome tracking (length of stay, program completion, 30/60/90-day follow-up)
- Advanced analytics for Aftercare programs (referral volume trends, source orgs, conversion rate)
- Mobile app for Aftercare Managers (bed availability updates on the go)
- Automated bed availability sync via API for large Aftercare networks
- Multi-language support

---

*End of PRD v1.0*
