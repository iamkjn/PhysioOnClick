# Product

## Register

product

## Users

- **Patient** — books and pays for remote physio sessions, manages their own (and family members') profiles, views clinical notes and session summaries, follows an assigned exercise programme, and tracks recovery over time. Often mid-injury or mid-recovery; tech fluency varies, so the flow needs to stay low-friction rather than assume confidence with apps or forms.
- **Admin / Physio** (practice owner-operator) — manages availability via Cal.com, records clinical assessments and session summaries, assigns exercises, and reviews recovery trends across patients. Wears both the clinician and operator hat, so admin screens need to support fast clinical entry, not just data review.

## Product Purpose

PhysioOnClick is an online-first physiotherapy practice: patients book and pay for remote consultations (web + companion Flutter app), then track recovery between sessions. Admin runs the clinical and scheduling side from the same backend (Firebase + Cal.com). Success is the booking → payment → attend → recovery loop completing without manual admin intervention, and patients coming back for repeat bookings.

## Brand Personality

Modern & efficient. Booking and the portal should feel like using a good app, not filling in a clinic intake form. Confidence comes from speed and clarity, not clinical formality.

## Anti-references

- **Cold SaaS dashboard.** Portal and admin surfaces should not read as a generic B2B analytics tool — data-heavy screens (recovery trends, bookings tables) still need to feel like a physio practice, not an ops console.

## Design Principles

- **Register splits by surface.** Public marketing pages (home, about, pricing, blog, `/glasgow-physiotherapist`) run brand register; patient portal and admin run product register (this file's default). Override per task when working a marketing page.
- **Efficient over ornamental.** Every booking/portal/admin flow should minimize friction and steps — the brand promise is "modern and efficient," so clunky forms or dense chrome undercut the pitch anywhere they appear.
- **Clarity over density, even on data screens.** Admin and recovery views carry real clinical data but should stay legible and calm rather than defaulting to dashboard clutter.
- **No sterile-SaaS drift.** Warmth and product identity (the existing Clarity palette, Fraunces/DM Sans pairing) carry into portal and admin, not just the public site.

## Accessibility & Inclusion

WCAG 2.1 AA baseline. No additional accommodation tier specified beyond AA at this time.
