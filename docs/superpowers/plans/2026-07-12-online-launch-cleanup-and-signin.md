# Online-Launch Content Cleanup, Local Login Fix, Nav Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all home-visit / in-person-Glasgow copy so the site reads as online-only, get local patient login working, and add a "Sign In" link to the header for existing patients.

**Architecture:** Three independent slices of the same Next.js 15 App Router codebase: (1) text-only edits across six marketing pages/components, (2) a content rewrite of one landing page plus its JSON-LD schema, (3) a conditional-render addition in the shared header component, (4) a local-environment procedure (no source change) that seeds the Firebase emulator so `components/auth-panel.tsx` (already correct) has user data to authenticate against.

**Tech Stack:** Next.js 15 (App Router, React 19 server + client components), TypeScript, Firebase Auth/Firestore emulator suite.

## Global Constraints

- No new environment variables, no new routes
- Do not modify `components/auth-panel.tsx`, `lib/firebase.ts`, or `firestore.rules` — the local login issue has no code-level bug (see spec Part B)
- `/glasgow-physiotherapist` keeps its URL and stays in `app/sitemap.ts` — rewrite its content, don't remove the route
- Leave the `PricingItem.mode` type (`lib/site-data.ts`) as-is — only remove the dead render branch and copy that referenced `"In-person"` mode, not the type option itself
- This repo has no test suite (per `CLAUDE.md`) — verification steps use `npm run build`/`npm run lint`, `grep`, and manual dev-server checks instead of automated tests

---

### Task 1: Remove home-visit / in-person copy from marketing pages

**Files:**
- Modify: `app/page.tsx:21`
- Modify: `app/contact/page.tsx:19`
- Modify: `app/pricing/page.tsx:10,17,39-56`
- Modify: `app/services/page.tsx:25`
- Modify: `app/about/page.tsx:44,71,171,181`
- Modify: `components/site-footer.tsx:11,33`

**Interfaces:** None — pure JSX/string content edits, no new props, functions, or exports. Nothing downstream depends on this task.

- [ ] **Step 1: Homepage trust bar — `app/page.tsx`**

Old:
```tsx
            <span>HCPC Registered</span>
            <span>CSP Member</span>
            <span>Home visits in Glasgow</span>
            <span>Online appointments across the UK</span>
```

New:
```tsx
            <span>HCPC Registered</span>
            <span>CSP Member</span>
            <span>Online appointments across the UK</span>
```

- [ ] **Step 2: Contact page location line — `app/contact/page.tsx`**

Old:
```tsx
              <div><strong>Location</strong><span>Glasgow home visits and online consultations across the UK</span></div>
```

New:
```tsx
              <div><strong>Location</strong><span>Online consultations across the UK</span></div>
```

- [ ] **Step 3: Pricing page meta description — `app/pricing/page.tsx`**

Old:
```tsx
  description: "Transparent physiotherapy pricing for Glasgow home visits and online consultations."
```

New:
```tsx
  description: "Transparent, online physiotherapy pricing with no hidden fees."
```

- [ ] **Step 4: Pricing page — remove dead in-person branch — `app/pricing/page.tsx`**

Old:
```tsx
  const pricing = getPublicPricing();
  const inPerson = pricing.filter((item) => item.mode === "In-person");
  const online = pricing.filter((item) => item.mode === "Online");
```

New:
```tsx
  const pricing = getPublicPricing();
  const online = pricing.filter((item) => item.mode === "Online");
```

Old:
```tsx
      <section className="page-section stack pricing-sections">
        {inPerson.length > 0 && (
          <div>
            <h2>In-Person Sessions <span>(Glasgow home visits)</span></h2>
            <div className="pricing-grid pricing-grid-three">
              {inPerson.map((item, i) => (
                <Reveal key={item.title} direction="up" delay={i * 100}>
                  <article className="simple-price-card">
                    <h3>{item.title}</h3>
                    <p className="muted">{item.duration}</p>
                    <strong>{formatCurrency(item.price)}</strong>
                    <p>{item.description}</p>
                    <Link className="button primary" href="/book">Book Now</Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        <div>
```

New:
```tsx
      <section className="page-section stack pricing-sections">
        <div>
```

- [ ] **Step 5: Services page hero copy — `app/services/page.tsx`**

Old:
```tsx
        <p>Comprehensive, evidence-based physiotherapy services delivered in-person in Glasgow or online across the UK.</p>
```

New:
```tsx
        <p>Comprehensive, evidence-based physiotherapy services delivered online across the UK.</p>
```

- [ ] **Step 6: About page highlights list — `app/about/page.tsx`**

Old:
```tsx
const highlights = [
  "4+ years of clinical physiotherapy experience",
  "NHS Tayside placement and orthopaedic rehab exposure",
  "In-person care in Glasgow and online support across the UK",
  "Evidence-based approach with calm, practical treatment planning"
];
```

New:
```tsx
const highlights = [
  "4+ years of clinical physiotherapy experience",
  "NHS Tayside placement and orthopaedic rehab exposure",
  "Online physiotherapy support across the UK",
  "Evidence-based approach with calm, practical treatment planning"
];
```

- [ ] **Step 7: About page founder copy — `app/about/page.tsx`**

Old:
```tsx
          <p>
            Her approach combines clear communication, practical rehabilitation planning and evidence-based clinical
            decision making, both in-person in Glasgow and through online appointments across the UK.
          </p>
```

New:
```tsx
          <p>
            Her approach combines clear communication, practical rehabilitation planning and evidence-based clinical
            decision making, delivered through online appointments across the UK.
          </p>
```

- [ ] **Step 8: About page stats band — `app/about/page.tsx`**

Old:
```tsx
          <div className="about-stat-card">
            <strong>UK-wide</strong>
            <span>Online consultations alongside Glasgow clinic care</span>
          </div>
```

New:
```tsx
          <div className="about-stat-card">
            <strong>UK-wide</strong>
            <span>Online consultations, wherever you are</span>
          </div>
```

- [ ] **Step 9: About page CTA band — `app/about/page.tsx`**

Old:
```tsx
          <p>Ready to discuss your symptoms and treatment options? Book an in-person or online assessment today.</p>
```

New:
```tsx
          <p>Ready to discuss your symptoms and treatment options? Book an online assessment today.</p>
```

- [ ] **Step 10: Footer tagline and Glasgow link — `components/site-footer.tsx`**

Old:
```tsx
          <p>Evidence-based physiotherapy in Glasgow and online across the UK. HCPC registered, CSP member.</p>
```

New:
```tsx
          <p>Evidence-based physiotherapy online across the UK. HCPC registered, CSP member.</p>
```

Old:
```tsx
          <Link href="/glasgow-physiotherapist">Glasgow, Scotland, UK</Link>
```

New:
```tsx
          <Link href="/glasgow-physiotherapist">Online physio for Glasgow patients</Link>
```

- [ ] **Step 11: Verify no home-visit/in-person copy remains in these files**

Run: `grep -rniE "home visit|in-person in glasgow|in-person or online" app/page.tsx app/contact/page.tsx app/pricing/page.tsx app/services/page.tsx app/about/page.tsx components/site-footer.tsx`
Expected: no output (no matches)

- [ ] **Step 12: Build check**

Run: `npm run build`
Expected: build completes with no type errors (confirms removing the `inPerson` variable didn't leave an unused-variable/type error, and JSX is valid)

- [ ] **Step 13: Commit**

```bash
git add app/page.tsx app/contact/page.tsx app/pricing/page.tsx app/services/page.tsx app/about/page.tsx components/site-footer.tsx
git commit -m "content: remove home-visit and in-person-Glasgow copy for online-only launch"
```

---

### Task 2: Rewrite the Glasgow SEO landing page for online positioning

**Files:**
- Modify: `app/glasgow-physiotherapist/page.tsx` (full content rewrite; file stays at the same path/route)

**Interfaces:** None — this is a leaf page component with no exports consumed elsewhere. `app/sitemap.ts` and `components/site-footer.tsx` link to this route by path string (`/glasgow-physiotherapist`), which is unchanged.

- [ ] **Step 1: Replace the file contents**

Old (full file):
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physiotherapist in Glasgow | PhysioOnClick",
  description:
    "Looking for a physiotherapist in Glasgow? Book evidence-based physiotherapy and rehabilitation with PhysioOnClick."
};

const faqItems = [
  {
    question: "Do you offer in-person physiotherapy in Glasgow?",
    answer: "Yes. PhysioOnClick offers in-person appointments in Glasgow alongside UK-wide online consultations."
  },
  {
    question: "Can I book online physiotherapy if I live outside Glasgow?",
    answer: "Yes. Online physiotherapy assessments and follow-ups are available across the UK."
  },
  {
    question: "What conditions do you treat?",
    answer:
      "Common areas include back pain, knee injuries, shoulder rehab, post-surgical recovery, neurological rehabilitation and mobility concerns."
  }
];

export default function GlasgowPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "PhysioOnClick",
    areaServed: "Glasgow, UK",
    medicalSpecialty: "Physiotherapy",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Glasgow",
      addressCountry: "GB"
    }
  };

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Local SEO landing page</span>
          <h1>Physiotherapist in Glasgow</h1>
          <p className="lead">
            PhysioOnClick provides calm, clinical physiotherapy in Glasgow with transparent pricing, evidence-based
            rehabilitation and secure online booking for local patients.
          </p>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h3>Local patient benefits</h3>
          <ul className="clean-list">
            <li>In-person care in Glasgow</li>
            <li>Online follow-up if needed</li>
            <li>Clear pricing and secure booking</li>
            <li>Trust-focused healthcare UX</li>
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <div className="panel stack soft-panel">
          <h2>Why local patients book PhysioOnClick</h2>
          <ul className="clean-list">
            <li>In-person assessments in Glasgow for musculoskeletal and post-surgical care</li>
            <li>Structured rehabilitation planning with clear milestones and home exercise support</li>
            <li>Online follow-up options for continuity and convenience</li>
            <li>Clear healthcare tone, clinical documentation and accessible design</li>
          </ul>
        </div>
        <div className="panel stack image-panel">
          <h2>Clinic map</h2>
          <div className="map-frame">
            <iframe
              title="Glasgow map"
              src="https://www.google.com/maps?q=Glasgow%20UK&output=embed"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="page-section card-grid">
        {faqItems.map((faq) => (
          <article className="card stack info-card" key={faq.question}>
            <h3>{faq.question}</h3>
            <p className="muted">{faq.answer}</p>
          </article>
        ))}
      </section>

      <section className="page-section panel stack">
        <span className="eyebrow">Google reviews ready</span>
        <p>
          Add your Google Business Profile review widget or embed code here to support local trust signals and stronger
          conversion from Glasgow-based searches.
        </p>
      </section>
    </div>
  );
}
```

New (full file):
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Physiotherapist for Glasgow Patients | PhysioOnClick",
  description:
    "Online physiotherapy for patients in Glasgow — evidence-based rehab and assessments, booked securely online. No clinic visit required."
};

const faqItems = [
  {
    question: "Do you treat patients in Glasgow?",
    answer:
      "Yes. PhysioOnClick is run by a Glasgow-based, HCPC registered physiotherapist and works with patients in Glasgow (and across the UK) entirely online, through secure video assessments and structured rehab plans."
  },
  {
    question: "Can I book online physiotherapy if I live outside Glasgow?",
    answer: "Yes. Online physiotherapy assessments and follow-ups are available anywhere in the UK."
  },
  {
    question: "What conditions do you treat?",
    answer:
      "Common areas include back pain, knee injuries, shoulder rehab, post-surgical recovery, neurological rehabilitation and mobility concerns."
  }
];

export default function GlasgowPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: "PhysioOnClick",
    areaServed: "Glasgow, UK",
    medicalSpecialty: "Physiotherapy"
  };

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Local SEO landing page</span>
          <h1>Online Physiotherapist for Glasgow Patients</h1>
          <p className="lead">
            PhysioOnClick provides calm, clinical physiotherapy for Glasgow patients — fully online, with transparent
            pricing, evidence-based rehabilitation and secure booking.
          </p>
        </div>
        <div className="page-hero-aside checklist-panel">
          <h3>Local patient benefits</h3>
          <ul className="clean-list">
            <li>Glasgow-based, HCPC registered physiotherapist</li>
            <li>Every session delivered online</li>
            <li>Clear pricing and secure booking</li>
            <li>Trust-focused healthcare UX</li>
          </ul>
        </div>
      </section>

      <section className="page-section two-col">
        <div className="panel stack soft-panel">
          <h2>Why Glasgow patients book PhysioOnClick</h2>
          <ul className="clean-list">
            <li>Online assessments for musculoskeletal and post-surgical care, wherever you are in Glasgow</li>
            <li>Structured rehabilitation planning with clear milestones and home exercise support</li>
            <li>Video follow-ups for continuity and convenience</li>
            <li>Clear healthcare tone, clinical documentation and accessible design</li>
          </ul>
        </div>
        <div className="panel stack image-panel">
          <h2>How online sessions work</h2>
          <ul className="clean-list">
            <li>Book a session online in a few minutes</li>
            <li>Join your assessment by secure video call</li>
            <li>Receive a personalised rehab plan and exercise prescription</li>
            <li>Track progress with follow-up sessions</li>
          </ul>
        </div>
      </section>

      <section className="page-section card-grid">
        {faqItems.map((faq) => (
          <article className="card stack info-card" key={faq.question}>
            <h3>{faq.question}</h3>
            <p className="muted">{faq.answer}</p>
          </article>
        ))}
      </section>

      <section className="page-section panel stack">
        <span className="eyebrow">Google reviews ready</span>
        <p>
          Add your Google Business Profile review widget or embed code here to support local trust signals and stronger
          conversion from Glasgow-based searches.
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify no in-person/address copy remains**

Run: `grep -niE "in-person|clinic map|PostalAddress|MedicalBusiness" app/glasgow-physiotherapist/page.tsx`
Expected: no output

- [ ] **Step 3: Confirm the route is still in the sitemap**

Run: `grep -n "glasgow-physiotherapist" app/sitemap.ts`
Expected: one match — the route entry is untouched by this task

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build completes with no errors

- [ ] **Step 5: Commit**

```bash
git add app/glasgow-physiotherapist/page.tsx
git commit -m "content: rewrite Glasgow landing page for online-only positioning"
```

---

### Task 3: Add a "Sign In" link to the site header

**Files:**
- Modify: `components/site-header.tsx:84-96` (desktop nav actions)
- Modify: `components/site-header.tsx:137-146` (mobile nav panel)

**Interfaces:**
- Consumes: existing `user: User | null` state (from `onAuthStateChanged`, already in the component) and existing `setMenuOpen: (v: boolean) => void` state setter — no new state needed
- Produces: nothing new for other components; this is a leaf UI change

- [ ] **Step 1: Desktop nav — show "Sign In" when signed out**

Old:
```tsx
            <div className="nav-actions simple-nav-actions">
              {user ? (
                <button type="button" className="call-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              ) : null}
              <Link className="call-link" href="/contact">
                Contact Us
              </Link>
              <Link className="button primary small" href="/book">
                Book Now
              </Link>
            </div>
```

New:
```tsx
            <div className="nav-actions simple-nav-actions">
              {user ? (
                <button type="button" className="call-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              ) : (
                <Link className="call-link" href="/patient">
                  Sign In
                </Link>
              )}
              <Link className="call-link" href="/contact">
                Contact Us
              </Link>
              <Link className="button primary small" href="/book">
                Book Now
              </Link>
            </div>
```

- [ ] **Step 2: Mobile nav panel — show "Sign In" when signed out**

Old:
```tsx
        {user ? (
          <button
            type="button"
            className="mobile-nav-link"
            style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        ) : null}
      </nav>
```

New:
```tsx
        {user ? (
          <button
            type="button"
            className="mobile-nav-link"
            style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        ) : (
          <Link
            className="mobile-nav-link"
            href="/patient"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
        )}
      </nav>
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: build completes with no errors

- [ ] **Step 4: Manual verification in the browser**

Run: `npm run dev`, then open `http://localhost:3000` in a browser while signed out.
Expected: a "Sign In" link is visible top-right of the header (desktop width) and inside the mobile hamburger menu (narrow width), both linking to `/patient`. Resize to mobile width (or use device toolbar) to confirm the mobile menu version too.

- [ ] **Step 5: Commit**

```bash
git add components/site-header.tsx
git commit -m "feat: add Sign In link to header for signed-out visitors"
```

---

### Task 4: Fix local login by seeding the Firebase emulator

**Files:** None modified — this task is a verified procedure, not a code change (see spec Part B: the auth code, redirects, and Firestore rules are already correct).

**Interfaces:** None.

- [ ] **Step 1: Confirm the emulator data directory is empty (reproduce the bug)**

Run: `ls -la .firebase-emulator-data/`
Expected: empty directory (only `.` and `..`) — this confirms why local sign-in currently fails (`auth/user-not-found` for any credentials, since the emulator has zero users)

- [ ] **Step 2: Start the Firebase emulator suite**

Run (in a dedicated terminal, leave it running): `npm run emulators`
Expected: log output showing the Auth emulator on port 9099, Firestore on port 8080, Storage on port 9199, and the Emulator UI on port 4000

- [ ] **Step 3: Seed the running emulator**

In a second terminal: `npm run seed:firestore`
Expected: script output confirming Firestore collections were seeded and the demo patient Auth users (`sarah.demo@physioonclick.co.uk`, `james.demo@physioonclick.co.uk`, `amina.demo@physioonclick.co.uk`, password `PhysioDemo2026!` unless `DEMO_PATIENT_PASSWORD` is overridden in `.env.local`) were created — see `scripts/seed-firestore.ts:41-42` and `:389-394`

- [ ] **Step 4: Verify the emulator now has data**

Run: `ls -la .firebase-emulator-data/`
Expected: no longer empty (this check only passes after the emulator has been cleanly stopped once, since `--export-on-exit` writes on shutdown — if checking while the emulator is still running, instead open `http://localhost:4000/auth` in a browser and confirm the three demo users are listed)

- [ ] **Step 5: Verify sign-in works end to end**

With the emulator still running, in a third terminal run: `npm run dev`, then in a browser go to `http://localhost:3000/patient` and sign in with `sarah.demo@physioonclick.co.uk` / `PhysioDemo2026!`.
Expected: the auth panel shows "Patient sign-in successful. Redirecting you to your portal…" and the page navigates to the patient portal — no bounce back to the login form.

- [ ] **Step 6: Stop the emulator cleanly so data exports**

In the emulator terminal: press `Ctrl+C` once and wait for it to exit.
Expected: log line confirming data was exported to `.firebase-emulator-data/` — this makes the fix persistent, so `npm run emulators` next time starts pre-seeded and Step 2 onward won't need repeating

No commit for this task — no files changed.

---

### Task 5: Remove home-visit / in-person copy from the homepage hero and root metadata

**Files:**
- Modify: `components/home-hero-section.tsx:43,49`
- Modify: `app/layout.tsx:14,19`

**Interfaces:** None — pure JSX/string content edits, no new props, functions, or exports.

- [ ] **Step 1: Homepage hero badge and copy — `components/home-hero-section.tsx`**

Old:
```tsx
        <span className="location-pill">Glasgow & Online Across the UK</span>
        <h1>
          Expert Physiotherapy,
          <span> One Click Away</span>
        </h1>
        <p className="home-hero-copy">
          Evidence-based physiotherapy by {founderName}, HCPC registered physiotherapist. In-person in Glasgow or
          online consultations across the UK.
        </p>
```

New:
```tsx
        <span className="location-pill">Online Across the UK</span>
        <h1>
          Expert Physiotherapy,
          <span> One Click Away</span>
        </h1>
        <p className="home-hero-copy">
          Evidence-based physiotherapy by {founderName}, HCPC registered physiotherapist. Online consultations
          across the UK.
        </p>
```

- [ ] **Step 2: Root metadata title/description — `app/layout.tsx`**

Old:
```tsx
  title: "PhysioOnClick | Physiotherapy in Glasgow and Online Across the UK",
```

New:
```tsx
  title: "PhysioOnClick | Online Physiotherapy Across the UK",
```

Old:
```tsx
    title: "PhysioOnClick",
    description: "Evidence-based physiotherapy and rehabilitation in Glasgow and online across the UK.",
```

New:
```tsx
    title: "PhysioOnClick",
    description: "Evidence-based online physiotherapy and rehabilitation across the UK.",
```

- [ ] **Step 3: Verify no home-visit/in-person copy remains**

Run: `grep -niE "in-person in glasgow|glasgow & online|in glasgow and online" components/home-hero-section.tsx app/layout.tsx`
Expected: no output

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build completes with no errors

- [ ] **Step 5: Commit**

```bash
git add components/home-hero-section.tsx app/layout.tsx
git commit -m "content: remove home-visit/in-person copy from homepage hero and root metadata"
```

---

### Task 6: Remove home-visit / in-person copy from the chat widget and Terms page

Found by the final whole-branch review — the chat widget (mounted globally in `app/layout.tsx`, rendered on every page) still quotes an in-person Glasgow price list that no longer matches the real pricing data, and the Terms page has two literal "in-person in Glasgow" references.

**Files:**
- Modify: `components/chat-widget.tsx:54,59`
- Modify: `app/terms/page.tsx:6,37`

**Interfaces:** None — pure string content edits.

- [ ] **Step 1: Chat widget "Online Rehab" chip text — `components/chat-widget.tsx`**

Old:
```tsx
    text: "UK-wide digital physiotherapy via secure video call with tailored exercise plans, progress tracking and weekly review calls.\n\nOnline patients receive the same structured rehabilitation planning as in-person sessions.",
```

New:
```tsx
    text: "UK-wide digital physiotherapy via secure video call with tailored exercise plans, progress tracking and weekly review calls.\n\nOnline patients receive the same structured rehabilitation planning.",
```

- [ ] **Step 2: Chat widget pricing text — `components/chat-widget.tsx`**

Old:
```tsx
const PRICING_TEXT =
  "In-person sessions (Glasgow):\n• Initial Assessment (45 min) — £65\n• Follow-Up Session (30 min) — £50\n• Extended Session (60 min) — £80\n\nOnline sessions (UK-wide):\n• Initial Online Assessment (60 min) — £50\n• Online Follow-Up (30 min) — £40\n\nPackages:\n• 4-Session Bundle — £180\n• 8-Session Bundle — £340\n\nNo GP referral required — you can self-refer.";
```

New:
```tsx
const PRICING_TEXT =
  "Online sessions (UK-wide):\n• Initial Online Assessment (60 min) — £50\n• Online Follow-Up (30 min) — £40\n\nPackages:\n• 4-Session Bundle — £180\n• 8-Session Bundle — £340\n\nNo GP referral required — you can self-refer.";
```

- [ ] **Step 3: Terms page meta description — `app/terms/page.tsx`**

Old:
```tsx
  description: "Terms and conditions for using PhysioOnClick physiotherapy services online and in-person in Glasgow."
```

New:
```tsx
  description: "Terms and conditions for using PhysioOnClick's online physiotherapy services."
```

- [ ] **Step 4: Terms page "Nature of the service" — `app/terms/page.tsx`**

Old:
```tsx
          <p>
            PhysioOnClick provides physiotherapy consultations online (UK-wide) and in-person in Glasgow.
            Booking a consultation creates a professional clinical relationship. The standard of care provided
            online is equal to that of an in-person consultation — a lower standard of care is not acceptable
            simply because the interaction is remote.
          </p>
```

New:
```tsx
          <p>
            PhysioOnClick provides physiotherapy consultations online across the UK.
            Booking a consultation creates a professional clinical relationship. The standard of care provided
            online is equal to that of an in-person consultation — a lower standard of care is not acceptable
            simply because the interaction is remote.
          </p>
```

Do not touch `app/terms/page.tsx:57` ("Some clinical presentations require in-person assessment...") — this is a legitimate telehealth safety/liability disclaimer about referring out cases that need hands-on care, not a claim that PhysioOnClick offers in-person sessions. Leave it as-is.

- [ ] **Step 5: Verify no home-visit/in-person copy remains**

Run: `grep -niE "in-person sessions \(glasgow\)|in-person in glasgow|as in-person sessions" components/chat-widget.tsx app/terms/page.tsx`
Expected: no output

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: build completes with no errors

- [ ] **Step 7: Commit**

```bash
git add components/chat-widget.tsx app/terms/page.tsx
git commit -m "content: remove home-visit/in-person copy from chat widget and terms page"
```

---

## Self-Review Notes

- **Spec coverage:** Part A → Task 1 + Task 2 (Glasgow page called out separately since it's a full content rewrite, not a one-line edit). Part B → Task 4. Part C → Task 3. All three spec parts have a task.
- **`about/page.tsx` extra instances:** the spec listed lines 71 and 181 for this file; while pulling exact current text for this plan, two more in-person/Glasgow-clinic references were found in the same file (the `highlights` array and the stats band) that fall squarely within the approved "remove all home-visit/in-person copy" goal — included as Steps 6 and 8 so the page doesn't end up half-cleaned.
- **Type consistency:** Task 3's `setMenuOpen` and `user` are the exact names already declared in `components/site-header.tsx` (verified by reading the file) — no renaming across steps.
- **No placeholders:** every step shows exact before/after code; no "TBD" or "similar to above" shortcuts.
