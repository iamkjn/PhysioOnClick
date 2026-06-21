# Launch Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the four minimum-viable compliance changes required before PhysioOnClick goes live, based on CSP digital physiotherapy guidance.

**Architecture:** Four independent tasks executed in order. Tasks 1–2 modify existing files; Tasks 3–4 create new pages. Task 5 wires the footer. No shared state between tasks.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Firebase Firestore, Tailwind-free (custom CSS classes via global stylesheet).

## Global Constraints

- No test suite — verification is manual: run `npm run dev`, navigate to the affected page, confirm expected behaviour
- Follow existing legal page layout pattern: `<div className="site-shell">` → `<section className="page-hero legal-hero">` → `<section className="page-section legal-grid">`
- No new dependencies
- TypeScript — no `any` types, no `@ts-ignore`
- Commit after every task

---

### Task 1: Remove Symptom Checker

**Files:**
- Delete: `app/symptom-checker/page.tsx`
- Delete: `components/symptom-checker.tsx`
- Delete: `app/api/symptom-checker/route.ts`
- Modify: `app/medical-disclaimer/page.tsx` (line 19)
- Modify: `components/site-search-strip.tsx` (lines 24–26 and 32)
- Modify: `lib/firestore-helpers.ts` (lines 38–47)
- Modify: `lib/site-data.ts` (lines 375–386)

**Interfaces:**
- Consumes: nothing
- Produces: `/symptom-checker` returns 404, no broken imports anywhere

- [ ] **Step 1: Delete the three symptom checker files**

```bash
rm app/symptom-checker/page.tsx
rm components/symptom-checker.tsx
rm app/api/symptom-checker/route.ts
```

- [ ] **Step 2: Update medical disclaimer — remove AI symptom checker reference**

In `app/medical-disclaimer/page.tsx`, line 19, change:

```tsx
// Before
Content on PhysioOnClick, including blog articles and the AI symptom checker, is for general educational
information only and does not replace individual medical advice, diagnosis or emergency care.

// After — update the <p> tag content to:
<p>
  Content on PhysioOnClick, including blog articles, is for general educational
  information only and does not replace individual medical advice, diagnosis or emergency care.
</p>
```

- [ ] **Step 3: Update site-search-strip — remove symptom-checker branch**

In `components/site-search-strip.tsx`, remove lines 24–26 entirely:

```tsx
// Remove this block:
if (pathname.startsWith("/symptom-checker")) {
  return { placeholder: "Search symptoms, areas of pain or rehab help", scope: "symptom" };
}
```

Also update the default placeholder on line 32 — remove "or symptoms":

```tsx
// Before
return { placeholder: "Search services, pricing, blog articles or symptoms", scope: "general" };

// After
return { placeholder: "Search services, pricing or blog articles", scope: "general" };
```

- [ ] **Step 4: Remove saveSymptomCheck from firestore-helpers**

In `lib/firestore-helpers.ts`, remove lines 38–47:

```tsx
// Remove this entire function:
export async function saveSymptomCheck(payload: Record<string, unknown>) {
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  await addDoc(collection(db, "symptomChecks"), {
    ...payload,
    createdAt: serverTimestamp()
  });
}
```

- [ ] **Step 5: Remove symptomAreas from site-data**

In `lib/site-data.ts`, remove lines 375–386 (the `symptomAreas` export at the end of the file):

```tsx
// Remove this entire export:
export const symptomAreas = [
  "Back",
  "Neck",
  "Shoulder",
  "Elbow",
  "Hand or wrist",
  "Hip",
  "Knee",
  "Ankle or foot",
  "Balance or walking",
  "General rehabilitation"
];
```

- [ ] **Step 6: Verify no broken imports**

```bash
npm run build 2>&1 | grep -E "error|Error|symptom"
```

Expected: no output (clean build). If any file still imports from the deleted files, remove those import lines.

- [ ] **Step 7: Manual check**

Start `npm run dev`. Navigate to `http://localhost:3000/symptom-checker`. Confirm it shows the 404 page. Navigate to `/medical-disclaimer` and confirm "AI symptom checker" is no longer mentioned.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove symptom checker for CSP compliance"
```

---

### Task 2: Booking Form — Informed Consent Checkbox

**Files:**
- Modify: `components/booking-form.tsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: booking form blocks submission unless consent checkbox is checked

- [ ] **Step 1: Add consent state to the form state**

In `components/booking-form.tsx`, the `form` state object currently is:

```tsx
const [form, setForm] = useState({
  fullName: "", email: "", phone: "",
  service: initialService,
  appointmentDate: "", appointmentTime: "", notes: "",
});
```

Add `consent: false`:

```tsx
const [form, setForm] = useState({
  fullName: "", email: "", phone: "",
  service: initialService,
  appointmentDate: "", appointmentTime: "", notes: "",
  consent: false,
});
```

- [ ] **Step 2: Add the consent checkbox above the submit button**

Find the submit button section (around line 251 — the `<div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>` that wraps the submit button). Insert the checkbox **immediately before** that div:

```tsx
{/* Consent */}
<label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13.5, color: "#164E63", lineHeight: 1.5 }}>
  <input
    type="checkbox"
    required
    checked={form.consent}
    onChange={e => set("consent", e.target.checked as unknown as string)}
    style={{ marginTop: 2, flexShrink: 0, accentColor: "#0891B2", width: 16, height: 16 }}
  />
  <span>
    I consent to online consultation and the storage of my personal and clinical data as described in the{" "}
    <a href="/privacy-policy" style={{ color: "#0891B2", textDecoration: "underline" }}>Privacy Policy</a>.
  </span>
</label>
```

- [ ] **Step 3: Fix the `set` helper to handle boolean values**

The existing `set` helper only handles strings:

```tsx
const set = (field: string, value: string) =>
  setForm(f => ({ ...f, [field]: value }));
```

Update it to accept `string | boolean`:

```tsx
const set = (field: string, value: string | boolean) =>
  setForm(f => ({ ...f, [field]: value }));
```

Also remove the `as unknown as string` cast from the checkbox onChange you added in Step 2:

```tsx
onChange={e => set("consent", e.target.checked)}
```

- [ ] **Step 4: Reset consent on "Book another appointment"**

The reset button's `onClick` already resets all fields. Add `consent: false` to the reset object:

```tsx
onClick={() => {
  setForm({
    fullName: "", email: "", phone: "", service: "",
    appointmentDate: "", appointmentTime: "", notes: "",
    consent: false,
  });
  setStatus("idle");
}}
```

- [ ] **Step 5: Manual verification**

Run `npm run dev`. Navigate to `http://localhost:3000/book`. Try to submit the form without checking the consent box — the browser should block submission. Check the box and submit — the form should proceed as normal.

- [ ] **Step 6: Commit**

```bash
git add components/booking-form.tsx
git commit -m "feat: add informed consent checkbox to booking form"
```

---

### Task 3: Terms & Conditions Page

**Files:**
- Create: `app/terms/page.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `/terms` page rendered in the existing legal page layout

- [ ] **Step 1: Create the Terms & Conditions page**

Create `app/terms/page.tsx` with the following content:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | PhysioOnClick",
  description: "Terms and conditions for using PhysioOnClick physiotherapy services online and in-person in Glasgow."
};

export default function TermsPage() {
  return (
    <div className="site-shell">
      <section className="page-hero legal-hero">
        <div className="stack">
          <span className="eyebrow">Terms &amp; Conditions</span>
          <h1>Clear terms for a clinical relationship built on trust.</h1>
        </div>
        <div className="legal-aside">
          <strong>Last updated</strong>
          <p className="muted">June 2026</p>
        </div>
      </section>

      <section className="page-section legal-grid">

        <article className="panel stack soft-panel">
          <h2>Who we are</h2>
          <p>
            PhysioOnClick is operated by Shivaliba Zala, an HCPC registered physiotherapist and CSP member.
            For any queries, contact us at{" "}
            <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>.
          </p>
        </article>

        <article className="panel stack">
          <h2>Nature of the service</h2>
          <p>
            PhysioOnClick provides physiotherapy consultations online (UK-wide) and in-person in Glasgow.
            Booking a consultation creates a professional clinical relationship. The standard of care provided
            online is equal to that of an in-person consultation — a lower standard of care is not acceptable
            simply because the interaction is remote.
          </p>
        </article>

        <article className="panel stack soft-panel">
          <h2>Geographic scope</h2>
          <p>
            Services are provided to patients physically located in the United Kingdom at the time of
            consultation. Existing patients temporarily abroad (excluding the USA, Australia, and Canada)
            may continue care with prior agreement. If you are unsure whether your location is covered,
            contact us before booking.
          </p>
        </article>

        <article className="panel stack">
          <h2>Limitations of online assessment</h2>
          <p>
            Some clinical presentations require in-person assessment to diagnose or treat safely. If your
            physiotherapist determines that remote consultation is not appropriate for your condition, they
            will advise you accordingly and recommend an alternative pathway.
          </p>
        </article>

        <article className="panel stack soft-panel">
          <h2>Payment &amp; cancellation</h2>
          <p>
            Payment is taken at the time of the appointment, not online. Please provide at least 24 hours&apos;
            notice to cancel or rearrange. Late cancellations and non-attendance may be charged in full.
            See our <Link href="/cancellation-policy">Cancellation Policy</Link> for full details.
          </p>
        </article>

        <article className="panel stack">
          <h2>Data &amp; privacy</h2>
          <p>
            Your personal and clinical data is processed in accordance with UK GDPR and the Data Protection
            Act 2018. See our <Link href="/privacy-policy">Privacy Policy</Link> for details on what we
            collect, how we use it, and your rights.
          </p>
        </article>

        <article className="panel stack soft-panel">
          <h2>Emergency situations</h2>
          <p>
            PhysioOnClick is not an emergency service. If you are experiencing a medical emergency, call
            <strong> 999</strong> immediately. For urgent but non-emergency concerns, contact{" "}
            <strong>NHS 111</strong>.
          </p>
        </article>

        <article className="panel stack">
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of Scotland. Any disputes arising from the use of this
            service are subject to the exclusive jurisdiction of the Scottish courts.
          </p>
        </article>

        <article className="panel stack soft-panel">
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after changes are
            published constitutes acceptance of the updated terms. The date at the top of this page reflects
            the most recent revision.
          </p>
        </article>

      </section>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`. Navigate to `http://localhost:3000/terms`. Confirm the page renders correctly with the legal layout, all sections are visible, and the links to `/privacy-policy` and `/cancellation-policy` work.

- [ ] **Step 3: Commit**

```bash
git add app/terms/page.tsx
git commit -m "feat: add Terms & Conditions page for CSP compliance"
```

---

### Task 4: Privacy Policy — Production-Ready Upgrade

**Files:**
- Modify: `app/privacy-policy/page.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `/privacy-policy` shows a full UK GDPR-compliant policy replacing the placeholder text

- [ ] **Step 1: Replace the privacy policy page content**

Replace the entire content of `app/privacy-policy/page.tsx` with:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PhysioOnClick",
  description: "How PhysioOnClick collects, stores and uses your personal and clinical data in line with UK GDPR."
};

export default function PrivacyPolicyPage() {
  return (
    <div className="site-shell">
      <section className="page-hero legal-hero">
        <div className="stack">
          <span className="eyebrow">Privacy policy</span>
          <h1>GDPR-conscious handling of patient and website data.</h1>
        </div>
        <div className="legal-aside">
          <strong>Last updated</strong>
          <p className="muted">June 2026</p>
        </div>
      </section>

      <section className="page-section legal-grid">

        <article className="panel stack soft-panel">
          <h2>Who we are</h2>
          <p>
            PhysioOnClick is operated by Shivaliba Zala (trading as PhysioOnClick), the data controller for
            all personal data collected through this website and associated services. Contact:{" "}
            <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>.
          </p>
        </article>

        <article className="panel stack">
          <h2>What data we collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li><strong>Contact details:</strong> name, email address, phone number</li>
            <li><strong>Appointment data:</strong> preferred dates, times, and service type</li>
            <li><strong>Clinical information:</strong> condition notes, session records, progress data, and exercise assignments entered through the patient portal</li>
            <li><strong>Payment references:</strong> transaction identifiers from Stripe (we do not store card numbers)</li>
            <li><strong>Usage data:</strong> pages visited and session activity, collected anonymously via analytics</li>
          </ul>
        </article>

        <article className="panel stack soft-panel">
          <h2>Lawful basis for processing</h2>
          <ul>
            <li><strong>Contract performance:</strong> processing your name, email, and appointment details to deliver the service you have booked</li>
            <li><strong>Legal obligation:</strong> retaining clinical records for the period required by HCPC standards</li>
            <li><strong>Legitimate interests:</strong> maintaining secure systems, communicating about your care, and improving the service</li>
          </ul>
        </article>

        <article className="panel stack">
          <h2>Third-party processors</h2>
          <p>Your data is processed by the following third parties on our behalf:</p>
          <ul>
            <li><strong>Google Firebase</strong> (Authentication, Firestore database, Storage) — used to store account, appointment, and clinical data securely</li>
            <li><strong>Stripe</strong> — used for payment processing; card data is handled entirely by Stripe and is not stored by PhysioOnClick</li>
            <li><strong>Cal.com</strong> — used for appointment scheduling; booking data is shared with Cal.com to manage your calendar appointment</li>
          </ul>
        </article>

        <article className="panel stack soft-panel">
          <h2>Data retention</h2>
          <ul>
            <li><strong>Clinical records:</strong> retained for 8 years from the date of last contact, in line with HCPC record-keeping standards</li>
            <li><strong>Appointment and contact enquiries:</strong> retained for 12 months after the last interaction</li>
            <li><strong>Payment references:</strong> retained for 7 years for financial compliance purposes</li>
          </ul>
        </article>

        <article className="panel stack">
          <h2>Your rights</h2>
          <p>Under UK GDPR you have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal data we hold about you</li>
            <li><strong>Rectification</strong> of inaccurate data</li>
            <li><strong>Erasure</strong> of your data where there is no legal obligation to retain it</li>
            <li><strong>Restriction</strong> of processing in certain circumstances</li>
            <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Object</strong> to processing based on legitimate interests</li>
          </ul>
          <p>To exercise any of these rights, email{" "}
            <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>.
          </p>
        </article>

        <article className="panel stack soft-panel">
          <h2>Cookies</h2>
          <p>
            This website uses session cookies for authentication only. We do not use advertising,
            tracking, or third-party marketing cookies. Anonymous usage analytics may be collected
            to help us improve the service.
          </p>
        </article>

        <article className="panel stack">
          <h2>Complaints</h2>
          <p>
            If you have concerns about how we handle your data, you have the right to complain to the
            Information Commissioner&apos;s Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
          </p>
        </article>

      </section>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`. Navigate to `http://localhost:3000/privacy-policy`. Confirm all eight sections render, bullet lists display correctly, and email/external links are present.

- [ ] **Step 3: Commit**

```bash
git add app/privacy-policy/page.tsx
git commit -m "feat: upgrade privacy policy to UK GDPR-compliant content"
```

---

### Task 5: Footer — Add Terms Link

**Files:**
- Modify: `components/site-footer.tsx`

**Interfaces:**
- Consumes: `/terms` page from Task 3
- Produces: footer includes a "Terms" link visible on all pages

- [ ] **Step 1: Add Terms link to the footer**

In `components/site-footer.tsx`, the footer currently has no legal links section. Add a "Terms" link in the Quick links column, after the existing Contact link:

```tsx
// Current Quick links column:
<div>
  <h4>Quick links</h4>
  <Link href="/about">About</Link>
  <Link href="/services">Services</Link>
  <Link href="/pricing">Pricing</Link>
  <Link href="/blog">Blog</Link>
  <Link href="/contact">Contact</Link>
</div>

// Updated — add legal links after Contact:
<div>
  <h4>Quick links</h4>
  <Link href="/about">About</Link>
  <Link href="/services">Services</Link>
  <Link href="/pricing">Pricing</Link>
  <Link href="/blog">Blog</Link>
  <Link href="/contact">Contact</Link>
  <Link href="/terms">Terms</Link>
  <Link href="/privacy-policy">Privacy Policy</Link>
</div>
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`. Scroll to the footer on any page. Confirm "Terms" and "Privacy Policy" links are present and navigate to the correct pages.

- [ ] **Step 3: Commit**

```bash
git add components/site-footer.tsx
git commit -m "feat: add Terms and Privacy Policy links to site footer"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Remove symptom checker (3 files deleted, 4 files updated) — Task 1
- ✅ Booking consent checkbox — Task 2
- ✅ Terms & Conditions page — Task 3
- ✅ Privacy Policy upgrade — Task 4
- ✅ Footer Terms link — Task 5

**Placeholder scan:** No TBDs, no "handle edge cases", all code blocks are complete.

**Type consistency:** `set` helper updated to `string | boolean` in Task 2 Step 3 matches the checkbox `onChange` usage in Step 2.
