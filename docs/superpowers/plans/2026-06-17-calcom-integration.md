# Cal.com Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Cal.com appointment booking into PhysioOnClick via a cal.js embed on a new `/book` page, a Flutter WebView on mobile, and a webhook that syncs confirmed bookings into the existing Firestore `bookings` collection so the admin dashboard and patient portal require no changes.

**Architecture:** Cal.com is the scheduling source of truth. The website embeds the Cal.com widget via cal.js on a new `/book` page; nav and homepage CTAs are updated to point there; the old custom booking form on the pricing page is retired. A Next.js webhook route (`POST /api/cal-webhook`) receives `BOOKING_CREATED`, `BOOKING_CANCELLED`, and `BOOKING_RESCHEDULED` events, verifies the HMAC signature, and writes/updates Firestore docs. The admin panel gets colour-coded status badges plus Cancel (Server Action → Cal.com API) and Reschedule (link) actions. The Flutter app replaces the manual booking form with a `WebViewWidget` and removes the Blog tab from the bottom nav.

**Tech Stack:** Next.js 15 App Router, React 19, Firebase Admin SDK, cal.js embed script, Cal.com REST API v2, Flutter with `webview_flutter ^4.0.0`.

## Global Constraints

- Cal.com username: `krunal-nayak-0nbytj`
- Cal.com API header: `cal-api-version: 2024-08-13`
- Firestore `bookings` schema: additive only — never rename or remove existing fields
- `status` values: `"confirmed"` (Cal.com webhook), `"pending"` (legacy form), `"cancelled"`
- `source` values: `"cal-com"` (webhook), `"website-booking-form"`, `"flutter-mobile-app"` (legacy)
- Appointment dates/times stored and displayed in `Europe/London` timezone
- No test suite — verification uses dev server, browser inspection, and curl
- `webview_flutter: ^4.0.0` — requires Flutter 3.16+

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/cal-embed.tsx` | Create | cal.js inline embed client component |
| `app/book/page.tsx` | Create | Dedicated `/book` route |
| `app/api/cal-webhook/route.ts` | Create | Webhook: HMAC verify + Firestore sync |
| `app/admin/actions.ts` | Create | Server Action: cancel booking via Cal.com API |
| `components/site-header.tsx` | Modify | Add "Book" nav link; update CTA to `/book` |
| `app/page.tsx` | Modify | Update hero CTAs from `/pricing#book` to `/book` |
| `app/pricing/page.tsx` | Modify | Remove BookingPanel; add book CTA section |
| `app/sitemap.ts` | Modify | Add `/book` route |
| `components/admin-bookings-table.tsx` | Modify | `calBookingUid` field; status badges; actions column |
| `app/globals.css` | Modify | Status badge colour classes; actions layout |
| `components/booking-panel.tsx` | Delete | Replaced by Cal.com embed |
| `mobile_app/pubspec.yaml` | Modify | Add `webview_flutter: ^4.0.0` |
| `mobile_app/lib/src/features/booking/booking_screen.dart` | Modify | Replace form with `WebViewWidget` |
| `mobile_app/lib/src/features/root/root_shell.dart` | Modify | Remove Blog tab |

---

### Task 1: Cal.com embed component and /book page

**Files:**
- Create: `components/cal-embed.tsx`
- Create: `app/book/page.tsx`

**Interfaces:**
- Produces: `CalEmbed` — named export, no props, renders the Cal.com inline booking widget using `NEXT_PUBLIC_CAL_USERNAME`

- [ ] **Step 1: Create the CalEmbed client component**

Create `components/cal-embed.tsx`:

```tsx
"use client";

import Script from "next/script";

declare global {
  interface Window {
    Cal?: (...args: unknown[]) => void;
  }
}

export function CalEmbed() {
  function onLoad() {
    window.Cal?.("init", { origin: "https://cal.com" });
    window.Cal?.("inline", {
      elementOrSelector: "#cal-embed",
      calLink: process.env.NEXT_PUBLIC_CAL_USERNAME,
    });
  }

  return (
    <>
      <Script
        src="https://app.cal.com/embed/embed.js"
        strategy="lazyOnload"
        onLoad={onLoad}
      />
      <div id="cal-embed" style={{ minHeight: "700px", width: "100%" }} />
    </>
  );
}
```

- [ ] **Step 2: Create the /book page**

Create `app/book/page.tsx`:

```tsx
import type { Metadata } from "next";

import { CalEmbed } from "@/components/cal-embed";

export const metadata: Metadata = {
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default function BookPage() {
  return (
    <div className="site-shell">
      <section className="page-hero">
        <div className="stack">
          <span className="eyebrow">Book online</span>
          <h1>Book your appointment</h1>
          <p className="lead">
            Choose a service and a time that works for you. Your confirmation is sent instantly by email.
          </p>
        </div>
      </section>
      <section className="page-section">
        <CalEmbed />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000/book`. Confirm:
- Page renders with the hero heading "Book your appointment"
- Cal.com booking widget loads inside the `#cal-embed` div (may take 1–2 seconds on `lazyOnload`)
- All 5 event types appear: Initial Assessment, Follow-Up Session, Extended Session, Initial Online Assessment, Online Follow-Up
- Selecting an event type shows a calendar with available slots

- [ ] **Step 4: Commit**

```bash
git add components/cal-embed.tsx app/book/page.tsx
git commit -m "feat: add CalEmbed component and /book page"
```

---

### Task 2: Update navigation, homepage, pricing page, sitemap — retire old booking form

**Files:**
- Modify: `components/site-header.tsx`
- Modify: `app/page.tsx`
- Modify: `app/pricing/page.tsx`
- Modify: `app/sitemap.ts`
- Delete: `components/booking-panel.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: all booking CTAs on the site now point to `/book`

- [ ] **Step 1: Update site-header — add Book nav link and fix CTA button**

Replace the entire contents of `components/site-header.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="header-wrap simple-header">
      <div className="site-shell">
        <div className="nav-row simple-nav">
          <Link className="brand simple-brand" href="/">
            <span className="brand-mark">P</span>
            <div>
              <strong>PhysioOnClick</strong>
            </div>
          </Link>
          <nav className="simple-nav-links" aria-label="Primary">
            {navItems.map((item) => (
              <Link className={isActive(item.href) ? "active" : undefined} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions simple-nav-actions">
            <Link className="call-link" href="/contact">
              Call Us
            </Link>
            <Link className="button primary small" href="/book">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Update homepage hero buttons**

In `app/page.tsx`, update both `href` values from `/pricing#book` to `/book`:

```tsx
<div className="button-row">
  <Link className="button primary" href="/book" prefetch>
    Book Your Session
  </Link>
  <Link className="button secondary inverted" href="/services" prefetch>
    Explore Services
  </Link>
</div>
```

- [ ] **Step 3: Update pricing page — remove BookingPanel, add CTA**

Replace the entire contents of `app/pricing/page.tsx` imports block and the bottom section. The full file should become:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { getPublicPricing } from "@/lib/public-content";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing | PhysioOnClick",
  description: "Transparent physiotherapy pricing for Glasgow home visits and online consultations."
};
```

Then in the JSX, find and replace the `<section className="page-section" id="book">` block (which contains `<BookingPanel pricingItems={pricing} />`) with:

```tsx
<section className="page-section" id="book">
  <div className="panel stack">
    <span className="eyebrow">Ready to book?</span>
    <h3>Schedule your appointment online</h3>
    <p>Pick a time that suits you. Confirmation is sent to your email instantly once the slot is confirmed.</p>
    <div className="button-row">
      <Link className="button primary" href="/book">
        Book now
      </Link>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add /book to sitemap**

In `app/sitemap.ts`, update the `routes` array:

```ts
const routes = [
  "",
  "/about",
  "/services",
  "/pricing",
  "/book",
  "/patient",
  "/admin",
  "/glasgow-physiotherapist",
  "/privacy-policy",
  "/medical-disclaimer",
  "/cancellation-policy",
  "/contact"
];
```

- [ ] **Step 5: Delete the old booking panel**

```bash
git rm components/booking-panel.tsx
```

- [ ] **Step 6: Verify**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. Confirm:
- `http://localhost:3000` — hero "Book Your Session" button routes to `/book`
- `http://localhost:3000/pricing` — bottom section shows the CTA card, not the old form
- Header shows "Book" nav link; "Book Now" button goes to `/book`
- `http://localhost:3000/sitemap.xml` includes `/book`

- [ ] **Step 7: Commit**

```bash
git add components/site-header.tsx app/page.tsx app/pricing/page.tsx app/sitemap.ts
git commit -m "feat: replace BookingPanel with Cal.com CTA, update all nav and homepage CTAs"
```

---

### Task 3: Webhook API route

**Files:**
- Create: `app/api/cal-webhook/route.ts`

**Interfaces:**
- Consumes: `getAdminDb()` from `@/lib/firebase-admin`; `FieldValue` from `firebase-admin/firestore`
- Produces: `POST /api/cal-webhook` — verifies Cal.com HMAC, writes/updates Firestore `bookings` docs

- [ ] **Step 1: Create the webhook route**

Create `app/api/cal-webhook/route.ts`:

```ts
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  try {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

function toLondonParts(isoString: string): {
  appointmentDate: string;
  appointmentTime: string;
  appointmentLabel: string;
} {
  const date = new Date(isoString);
  // Parse into London local time components reliably
  const londonStr = date.toLocaleString("en-GB", { timeZone: "Europe/London" });
  // en-GB locale returns "DD/MM/YYYY, HH:MM:SS"
  const [datePart, timePart] = londonStr.split(", ");
  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  const appointmentDate = `${year}-${month}-${day}`;
  const appointmentTime = `${hour}:${minute}`;
  const appointmentLabel = date.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  }) + ` at ${hour}:${minute}`;
  return { appointmentDate, appointmentTime, appointmentLabel };
}

type CalAttendee = { name: string; email: string; phoneNumber?: string };
type CalBookingPayload = {
  uid: string;
  startTime: string;
  attendees: CalAttendee[];
  eventType: { title: string };
  responses?: { notes?: { value?: string } };
};
type CalWebhookBody = {
  triggerEvent: string;
  payload?: CalBookingPayload;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Cal-Signature-256") ?? "";
  const secret = process.env.CAL_WEBHOOK_SECRET ?? "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as CalWebhookBody;
  const { triggerEvent, payload: booking } = body;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  if (triggerEvent === "BOOKING_CREATED" && booking) {
    const { appointmentDate, appointmentTime, appointmentLabel } = toLondonParts(booking.startTime);
    const attendee = booking.attendees[0] ?? { name: "", email: "" };
    await db.collection("bookings").add({
      fullName: attendee.name,
      email: attendee.email,
      phone: attendee.phoneNumber ?? "",
      service: booking.eventType.title,
      appointmentDate,
      appointmentTime,
      appointmentLabel,
      notes: booking.responses?.notes?.value ?? "",
      status: "confirmed",
      source: "cal-com",
      calBookingUid: booking.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else if (triggerEvent === "BOOKING_CANCELLED" && booking) {
    const snapshot = await db
      .collection("bookings")
      .where("calBookingUid", "==", booking.uid)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ status: "cancelled" });
    }
  } else if (triggerEvent === "BOOKING_RESCHEDULED" && booking) {
    const { appointmentDate, appointmentTime, appointmentLabel } = toLondonParts(booking.startTime);
    const snapshot = await db
      .collection("bookings")
      .where("calBookingUid", "==", booking.uid)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({ appointmentDate, appointmentTime, appointmentLabel });
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Test — reject unsigned requests**

```bash
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/cal-webhook \
  -H "Content-Type: application/json" \
  -d '{"triggerEvent":"BOOKING_CREATED"}'
```

Expected output: `401`

- [ ] **Step 3: Test — accept a correctly signed PING**

Temporarily set `CAL_WEBHOOK_SECRET=test-secret` in `.env.local` if it is still empty, then restart the dev server.

```bash
SECRET="test-secret"
BODY='{"triggerEvent":"PING"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
curl -s -X POST http://localhost:3000/api/cal-webhook \
  -H "Content-Type: application/json" \
  -H "X-Cal-Signature-256: $SIG" \
  -d "$BODY"
```

Expected output: `{"received":true}`

- [ ] **Step 4: Note on Firestore index**

The cancel and reschedule paths query `bookings` by `calBookingUid`. If Firestore returns an error about a missing index when a Cal.com event fires, go to Firebase Console → Firestore → Indexes → Single field, and add an ascending index on `bookings` / `calBookingUid`.

- [ ] **Step 5: Commit**

```bash
git add app/api/cal-webhook/route.ts
git commit -m "feat: Cal.com webhook route — HMAC verification, Firestore sync for created/cancelled/rescheduled"
```

---

### Task 4: Admin panel — status badges, cancel action, reschedule link

**Files:**
- Create: `app/admin/actions.ts`
- Modify: `components/admin-bookings-table.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `cancelCalBooking(calBookingUid: string): Promise<void>` — Server Action
- Consumes: `cancelCalBooking` bound to each Cal.com booking row via form action

- [ ] **Step 1: Create the Server Action**

Create `app/admin/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

export async function cancelCalBooking(calBookingUid: string): Promise<void> {
  const res = await fetch(
    `https://api.cal.com/v2/bookings/${calBookingUid}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CAL_API_KEY}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancellationReason: "Cancelled by clinic admin" }),
    }
  );

  if (!res.ok) {
    throw new Error(`Cal.com cancel failed: ${res.status}`);
  }

  revalidatePath("/admin");
}
```

- [ ] **Step 2: Update admin-bookings-table — full file**

Replace the entire contents of `components/admin-bookings-table.tsx` with:

```tsx
import { cancelCalBooking } from "@/app/admin/actions";
import { getAdminDb } from "@/lib/firebase-admin";

type BookingRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  appointmentLabel: string;
  status: string;
  notes: string;
  calBookingUid: string;
};

async function getBookings(): Promise<BookingRecord[]> {
  const db = getAdminDb();

  if (!db) {
    return [];
  }

  const snapshot = await db.collection("bookings").orderBy("createdAt", "desc").limit(25).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      fullName: String(data.fullName || data.name || ""),
      email: String(data.email || ""),
      phone: String(data.phone || "Not provided"),
      service: String(data.service || ""),
      appointmentLabel: String(
        data.appointmentLabel ||
          (data.appointmentDate && data.appointmentTime
            ? `${data.appointmentDate} ${data.appointmentTime}`
            : "TBC")
      ),
      status: String(data.status || "pending"),
      notes: String(data.notes || ""),
      calBookingUid: String(data.calBookingUid || ""),
    };
  });
}

export async function AdminBookingsTable() {
  const bookings = await getBookings();

  return (
    <section className="page-section">
      <div className="panel stack">
        <div className="dashboard-table-head">
          <div>
            <span className="eyebrow">Bookings</span>
            <h3>Latest appointment requests</h3>
          </div>
          <span className="dashboard-table-count">{bookings.length} shown</span>
        </div>

        {bookings.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Appointment</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fullName}</td>
                    <td>{item.service}</td>
                    <td>{item.appointmentLabel}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td className="dashboard-message-cell">{item.notes || "No notes provided."}</td>
                    <td>
                      <span className={`dashboard-status-pill status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.calBookingUid ? (
                        <div className="booking-actions">
                          <form action={cancelCalBooking.bind(null, item.calBookingUid)}>
                            <button
                              className="button small danger"
                              disabled={item.status === "cancelled"}
                              type="submit"
                            >
                              Cancel
                            </button>
                          </form>
                          <a
                            className="button small secondary"
                            href={`https://cal.com/reschedule/${item.calBookingUid}`}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Reschedule
                          </a>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No booking records are visible yet. New appointments will appear here after submission.</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add status badge colours to globals.css**

Append to the end of `app/globals.css`:

```css
/* Cal.com booking status badges */
.dashboard-status-pill.status-confirmed { background: #d1fae5; color: #065f46; }
.dashboard-status-pill.status-pending   { background: #fef3c7; color: #92400e; }
.dashboard-status-pill.status-cancelled { background: #fee2e2; color: #991b1b; }
.booking-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Open `http://localhost:3000/admin`. Confirm:
- Table renders the new "Actions" column
- Legacy bookings (no `calBookingUid`) show `—` in Actions and an amber "pending" badge
- No TypeScript errors: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add app/admin/actions.ts components/admin-bookings-table.tsx app/globals.css
git commit -m "feat: admin panel — status badges, Cal.com cancel Server Action, reschedule link"
```

---

### Task 5: Mobile — WebView booking screen and blog tab removal

**Files:**
- Modify: `mobile_app/pubspec.yaml`
- Modify: `mobile_app/lib/src/features/booking/booking_screen.dart`
- Modify: `mobile_app/lib/src/features/root/root_shell.dart`

**Interfaces:**
- Consumes: `webview_flutter` package (`WebViewController`, `WebViewWidget`, `JavaScriptMode`)
- Produces: Updated `BookingScreen` with Cal.com WebView; `RootShell` with 5 tabs (Blog removed)

- [ ] **Step 1: Add webview_flutter dependency**

In `mobile_app/pubspec.yaml`, add under `dependencies:` (after `cloud_firestore` or any existing line):

```yaml
  webview_flutter: ^4.0.0
```

Then run:

```bash
cd mobile_app && flutter pub get
```

Expected: Resolves and downloads `webview_flutter` without errors.

- [ ] **Step 2: Rewrite BookingScreen with WebView**

Replace the entire contents of `mobile_app/lib/src/features/booking/booking_screen.dart` with:

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../auth/auth_sheet.dart';
import 'booking_record.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('https://cal.com/krunal-nayak-0nbytj'));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, authSnapshot) {
          if (authSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final user = authSnapshot.data;

          if (user == null) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              children: [
                Text('Booking', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(
                  'Sign in first so your bookings are linked to your account.',
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: 18),
                const AuthSheet(),
              ],
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Text('Book an appointment', style: theme.textTheme.headlineMedium),
              ),
              Expanded(
                flex: 3,
                child: WebViewWidget(controller: _controller),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Text('Your recent bookings', style: theme.textTheme.titleLarge),
              ),
              Expanded(
                flex: 2,
                child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: FirebaseFirestore.instance
                      .collection('bookings')
                      .where('email', isEqualTo: user.email)
                      .snapshots(),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    final items = snapshot.data?.docs
                            .map((doc) => BookingRecord.fromMap(doc.data(), doc.id))
                            .toList() ??
                        <BookingRecord>[];

                    if (items.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text(
                          'No bookings found yet. Book an appointment above.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.service,
                                  style: theme.textTheme.titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                Text(item.appointmentLabel,
                                    style: theme.textTheme.bodyMedium),
                                const SizedBox(height: 4),
                                Text('Status: ${item.status}',
                                    style: theme.textTheme.bodySmall),
                                if (item.notes.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(item.notes,
                                      style: theme.textTheme.bodySmall),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 3: Remove Blog tab from RootShell**

Replace the entire contents of `mobile_app/lib/src/features/root/root_shell.dart` with:

```dart
import 'package:flutter/material.dart';

import '../booking/booking_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../services/services_screen.dart';
import '../symptom_checker/symptom_checker_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int currentIndex = 0;

  final screens = const [
    HomeScreen(),
    ServicesScreen(),
    SymptomCheckerScreen(),
    BookingScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (value) => setState(() => currentIndex = value),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.healing_rounded), label: 'Services'),
          BottomNavigationBarItem(icon: Icon(Icons.monitor_heart_rounded), label: 'Symptoms'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_month_rounded), label: 'Booking'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Verify build**

```bash
cd mobile_app && flutter build apk --debug 2>&1 | tail -30
```

Expected: `✓ Built build/app/outputs/flutter-apk/app-debug.apk` with no errors. If you see an import error for `BlogScreen`, confirm it was removed from `root_shell.dart`.

- [ ] **Step 5: Commit**

```bash
cd mobile_app
git add pubspec.yaml pubspec.lock \
  lib/src/features/booking/booking_screen.dart \
  lib/src/features/root/root_shell.dart
git commit -m "feat: Cal.com WebView booking screen, remove blog tab from mobile nav"
```

---

## Post-Implementation Checklist

After all tasks are complete:

- [ ] Set `CAL_WEBHOOK_SECRET` in `.env.local` after adding the webhook in Cal.com dashboard (Settings → Developer → Webhooks)
- [ ] Confirm production env has `NEXT_PUBLIC_CAL_USERNAME`, `CAL_API_KEY`, `CAL_WEBHOOK_SECRET`
- [ ] Set Cal.com availability schedule (days + hours) in Cal.com dashboard
- [ ] Optionally connect Google Calendar in Cal.com for conflict detection
- [ ] Test end-to-end: book a slot on `/book`, verify the booking appears in Firestore admin table with `status: "confirmed"`
- [ ] Test Cancel button on admin panel: confirm booking disappears from Cal.com and status updates to `"cancelled"` in Firestore
- [ ] Test mobile: open the Booking tab, confirm Cal.com loads in WebView, confirm completed bookings appear in the "Your recent bookings" list below
