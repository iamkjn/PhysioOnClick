# Launch Compliance Design — PhysioOnClick

**Date:** 2026-06-21
**Scope:** Minimum viable compliance before public launch, based on CSP digital physiotherapy guidance
**Source:** https://www.csp.org.uk/professional-clinical/professional-guidance/insurance/digital-virtual-physiotherapy

---

## Context

PhysioOnClick is a UK-based online physiotherapy platform run by Shivaliba Zala, HCPC registered physiotherapist and CSP member. The platform is launching online-first (remote consultations) with in-person Glasgow home visits planned later.

A CSP compliance audit identified four blockers that must be resolved before launch:
1. Symptom checker creates personalized diagnosis without prior assessment — violates CSP duty of care rules
2. Booking form collects patient data without explicit informed consent
3. No Terms & Conditions page — required by CSP for any site offering consultations
4. Privacy policy is a placeholder — not UK GDPR compliant

---

## Changes In Scope

### 1. Remove Symptom Checker

**Files to delete:**
- `app/symptom-checker/page.tsx`
- `components/symptom-checker.tsx`
- `app/api/symptom-checker/route.ts`

**Files to update:**
- `app/medical-disclaimer/page.tsx` — remove the reference to "AI symptom checker"
- `components/site-search-strip.tsx` — remove the `/symptom-checker` path check and `scope: "symptom"` branch (lines 24–25)
- `lib/firestore-helpers.ts` — remove the `saveSymptomCheck` function
- `lib/site-data.ts` — remove the `symptomAreas` export

**Reason:** The CSP states that providing personalized output based on individual patient inputs (pain area, duration, severity, symptoms) creates a duty of care. The current symptom checker returns named diagnoses (e.g., "Possible Rotator Cuff Issue") without prior clinical assessment, which violates CSP guidance. Removing it entirely is the safest approach for launch.

---

### 2. Booking Form — Informed Consent Checkbox

**File:** `components/booking-form.tsx`

Add a required checkbox immediately above the submit button:

```
☐ I consent to online consultation and the storage of my personal and clinical
  data as described in the [Privacy Policy](/privacy-policy).
```

**Behaviour:**
- Checkbox is unchecked by default
- Form cannot be submitted unless checkbox is checked (`required` attribute)
- Checkbox state tracked in form state alongside other fields
- No other changes to the form flow or success state

**Reason:** CSP states that booking a consultation creates a professional duty of care. Patients must explicitly acknowledge the clinical relationship being established and consent to data storage under UK GDPR.

---

### 3. New Terms & Conditions Page

**File to create:** `app/terms/page.tsx`

**Sections:**

1. **Who we are** — Shivaliba Zala, HCPC registered physiotherapist, CSP member, trading as PhysioOnClick (hello@physioonclick.co.uk)

2. **Nature of the service** — PhysioOnClick provides online physiotherapy consultations and in-person appointments in Glasgow. Booking a consultation creates a professional clinical relationship with a duty of care equal to that of an in-person consultation.

3. **Geographic scope** — Services are provided to patients physically located in the UK at the time of consultation. Patients temporarily abroad (excluding USA, Australia, Canada) may continue existing care with prior agreement.

4. **Limitations of online assessment** — Some conditions require in-person evaluation. The physiotherapist will advise if an in-person appointment is clinically necessary. Online assessment cannot substitute for emergency care.

5. **Payment & cancellation** — Sessions are paid at time of appointment (not online). Cancellations require 24 hours notice. Late cancellations may be charged in full. See [Cancellation Policy](/cancellation-policy).

6. **Data & privacy** — Personal and clinical data is processed in line with UK GDPR and the Data Protection Act 2018. See [Privacy Policy](/privacy-policy).

7. **Emergency situations** — PhysioOnClick is not an emergency service. In a medical emergency, call 999. For urgent but non-emergency concerns, contact NHS 111.

8. **Governing law** — These terms are governed by the laws of Scotland. Disputes are subject to the exclusive jurisdiction of the Scottish courts.

9. **Changes to these terms** — Terms may be updated; continued use of the service constitutes acceptance. Last updated: June 2026.

10. **Contact** — hello@physioonclick.co.uk

**Footer update:** Add "Terms" link to the footer legal links section (alongside Privacy Policy, Cancellation Policy, Medical Disclaimer).

---

### 4. Privacy Policy — Production-Ready Upgrade

**File:** `app/privacy-policy/page.tsx`

Replace placeholder content with a full UK GDPR-compliant privacy policy covering:

| Section | Content |
|---|---|
| Data controller | Shivaliba Zala trading as PhysioOnClick, hello@physioonclick.co.uk |
| Lawful basis | Contract performance (appointments), legitimate interests (clinical records), legal obligation (HCPC record keeping) |
| Data collected | Name, email, phone, appointment details, clinical notes, payment references |
| Third-party processors | Google Firebase (Auth, Firestore, Storage — EU region), Stripe (payment processing), Cal.com (scheduling) |
| Data retention | Clinical records: 8 years from last contact (HCPC standard). Contact enquiries: 12 months |
| Patient rights | Right to access, rectification, erasure (where no legal obligation to retain), restriction, portability, and to object |
| Cookies | Session cookies for authentication only; no advertising or tracking cookies |
| Contact for data requests | hello@physioonclick.co.uk |
| Complaints | Right to complain to the ICO (ico.org.uk) |

---

## Out of Scope (follow-up within 30 days of launch)

- PLI/insurance statement in footer and about page
- Medical disclaimer expansion (jurisdiction, duty of care statement)
- Solicitor review of T&Cs and Privacy Policy

---

## Constraints

- No test suite — verify changes visually in dev server
- Must not break existing booking flow or patient portal
- Keep legal pages consistent in style with existing legal pages (`.page-hero.legal-hero` pattern)
