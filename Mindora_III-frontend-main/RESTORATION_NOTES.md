# MINDORA patient, admin and therapist restoration

This branch restores the patient daily check-in experience, admin management
views and therapist workspace that were present in the prototype workflow
branch but absent from the Railway-connected frontend source.

## Patient

- `/today` includes daily check-in context, next appointment, weekly mood/streak
  information and acknowledgement of an assigned care plan.

## Admin

- `/admin/[section]` exposes platform analytics and notification delivery logs.
- Admin API/hooks cover users, therapist applications, approval/reactivation,
  moderation, audit and analytics. Actions remain subject to backend role checks.

## Therapist

- `/therapist/[workspace]` restores the therapist workspace.
- Treatment plans are drafts with patient acknowledgement.
- Medication updates are patient-reported items for therapist review.
- Prescription records are drafts/archives only; this UI does not issue
  prescriptions.
- Community and video-session links must report unavailable provider services
  honestly.

## Backend and rollout dependency

The matching APIs and additive schema migrations are in the Railway-connected
backend PR #7. Merge and deploy the backend only after its CI passes, production
migration histories are reconciled, and the required Railway variables are set.
Then verify the frontend against the staging backend before deploying it.

The restored schedule/dashboard distinguish loading, empty and failed states; a failed API request is never presented as a genuine zero or empty patient/appointment list. Historical IN_PERSON/CHAT appointments are labelled safely even though new bookings use VIDEO/AUDIO only.

No production account, database, domain, or Railway setting is changed by this
frontend branch.
