# UX Overhaul — Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Next.js web app with the new PhysioOnClick design system: navy/teal/gold tokens, DM Serif Display + DM Sans typography, skeleton shimmer, connectivity overlay, toast alerts, illustrated empty states, and a confirm dialog.

**Architecture:** All design tokens live in `app/globals.css`; existing classes pick them up automatically via CSS variable aliasing, so no component rewrites are needed for the color swap. New reusable components (`Skeleton`, `ConnectivityOverlay`, `Toast*`, `EmptyState`, `ConfirmDialog`) are added to `components/` and wired into `app/layout.tsx` where they need a root mount point.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS variables (no Tailwind). Google Fonts served via `<link>` in layout.

## Global Constraints

- Light mode only — no dark mode variants.
- No new npm packages — everything implemented with native browser APIs + existing stack.
- No test suite is configured for this project — verify with `npm run build` (must exit 0) and visual inspection of `npm run dev`.
- Commit after each task with `git add <files> && git commit -m "feat: ..."`.
- Never hardcode hex values in component files — always use CSS variables.
- `'use client'` directive required for any component using React hooks or browser APIs.

---

### Task 1: Design Tokens + Google Fonts

**Files:**
- Modify: `app/globals.css:1-12` (replace `:root` block)
- Modify: `app/globals.css:31-36` (update `body` font rule)
- Modify: `app/globals.css:57-64` (update `h1,h2,h3,h4` rule)
- Modify: `app/layout.tsx` (add `<link>` tags + update `<html>` + `<head>`)

**Interfaces:**
- Produces: CSS variables `--color-navy`, `--color-teal`, `--color-teal-dark`, `--color-teal-light`, `--color-gold`, `--color-gold-light`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--color-success`, `--color-error`, `--color-warning`, `--font-serif`, `--font-sans`. Legacy aliases `--primary`, `--ink`, `--bg`, `--muted`, `--line`, `--surface`, `--shadow` remain valid (they alias the new tokens) so all existing CSS classes continue to work without modification.

- [ ] **Step 1: Replace the `:root` block in `app/globals.css`**

Replace lines 1–12 (the entire existing `:root { }` block) with:

```css
:root {
  /* ── Design tokens ─────────────────────────────────────────── */
  --color-navy:          #0D1B2A;
  --color-teal:          #0B6E8E;
  --color-teal-dark:     #084F68;
  --color-teal-light:    #E6F3F8;
  --color-gold:          #B08030;
  --color-gold-light:    #FDF6E9;
  --color-bg:            #F7FAFC;
  --color-surface:       #FFFFFF;
  --color-border:        #E2E8F0;
  --color-text-primary:  #0D1B2A;
  --color-text-secondary:#4A5568;
  --color-success:       #059669;
  --color-error:         #DC2626;
  --color-warning:       #D97706;
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, -apple-system, sans-serif;

  /* ── Legacy aliases (keeps all existing CSS classes working) ── */
  --bg:          var(--color-bg);
  --surface:     var(--color-surface);
  --surface-alt: var(--color-teal-light);
  --ink:         var(--color-navy);
  --muted:       var(--color-text-secondary);
  --line:        var(--color-border);
  --primary:     var(--color-teal);
  --primary-dark:var(--color-teal-dark);
  --shadow:      0 2px 16px rgba(11, 110, 142, 0.08);
  --shell:       1340px;
}
```

- [ ] **Step 2: Update `body` font-family in `app/globals.css`**

Find the `body { ... }` rule (currently line ~31) and change `font-family`:

```css
body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--ink);
  background: var(--bg);
}
```

- [ ] **Step 3: Add serif font to headings in `app/globals.css`**

Find the `h1, h2, h3, h4 { ... }` rule (currently line ~57) and add `font-family`:

```css
h1,
h2,
h3,
h4 {
  margin: 0 0 1rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-family: var(--font-serif);
}
```

- [ ] **Step 4: Update `app/layout.tsx` to load Google Fonts and expose `<head>`**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@/components/analytics";
import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PhysioOnClick | Physiotherapy in Glasgow and Online Across the UK",
  description:
    "PhysioOnClick is a UK physiotherapy and rehabilitation platform offering in-person care in Glasgow and online consultations across the UK.",
  openGraph: {
    title: "PhysioOnClick",
    description: "Evidence-based physiotherapy and rehabilitation in Glasgow and online across the UK.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <Analytics />
        <ChatWidget />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: exits 0 with no TypeScript errors. The site should visually switch to DM Serif Display headings and DM Sans body text, and all accent colours shift to teal/navy.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: apply new design token system and DM Serif Display + DM Sans fonts"
```

---

### Task 2: Skeleton Shimmer Component

**Files:**
- Create: `components/skeleton.tsx`
- Modify: `app/globals.css` (append shimmer keyframe + `.skeleton` class)
- Modify: `components/recovery-percent-card.tsx` (replace `<p>Loading…</p>` with `<Skeleton>`)
- Modify: `components/home-dashboard.tsx` (wrap undefined-state in `<Skeleton>`)

**Interfaces:**
- Consumes: nothing
- Produces: `<Skeleton width? height? className? />` — renders a shimmer placeholder block. `width` defaults to `100%`, `height` defaults to `1.2em`.

- [ ] **Step 1: Append CSS to `app/globals.css`**

Add at the very end of `app/globals.css`:

```css
/* ── Skeleton shimmer ──────────────────────────────────────── */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-bg) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 8px;
  display: block;
}
```

- [ ] **Step 2: Create `components/skeleton.tsx`**

```tsx
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1.2em', className }: SkeletonProps) {
  return (
    <span
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 3: Apply Skeleton to `components/recovery-percent-card.tsx`**

Read the file to find the loading state. It renders something when `bookings` or data is `undefined`. Add the import at the top and replace the loading text:

```tsx
import { Skeleton } from "@/components/skeleton";
```

Find the section that renders while data is loading (the `undefined` state — before Firebase responds) and replace any `<p>Loading…</p>` or similar with:

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  <Skeleton height="2.5rem" width="80px" />
  <Skeleton height="1rem" width="140px" />
</div>
```

- [ ] **Step 4: Apply Skeleton to `components/home-dashboard.tsx`**

Find the section that renders before the user/person data resolves. Add the import and wrap the undefined-state content with skeleton rows that match the layout:

```tsx
import { Skeleton } from "@/components/skeleton";
```

Replace any loading spinner or blank area with:

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <Skeleton height="1.5rem" width="60%" />
  <Skeleton height="1rem" width="40%" />
  <Skeleton height="120px" />
</div>
```

- [ ] **Step 5: Build and check**

```bash
npm run build
```

Expected: exits 0. Start dev server (`npm run dev`) and open `http://localhost:3000` while signed in — you should see shimmer placeholders briefly before the dashboard data loads.

- [ ] **Step 6: Commit**

```bash
git add components/skeleton.tsx components/recovery-percent-card.tsx components/home-dashboard.tsx app/globals.css
git commit -m "feat: add skeleton shimmer component and apply to dashboard loading states"
```

---

### Task 3: Connectivity Overlay

**Files:**
- Create: `components/connectivity-overlay.tsx`
- Modify: `app/globals.css` (append overlay styles)
- Modify: `app/layout.tsx` (mount `<ConnectivityOverlay />` inside `<body>`)

**Interfaces:**
- Consumes: nothing
- Produces: `<ConnectivityOverlay />` — mounts a fixed full-screen overlay when `navigator.onLine` is false. "Retry" button calls `window.location.reload()`. Auto-hides when connectivity is restored.

- [ ] **Step 1: Append CSS to `app/globals.css`**

```css
/* ── Connectivity overlay ──────────────────────────────────── */
.connectivity-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.connectivity-overlay h2 {
  font-size: 1.5rem;
  color: var(--color-navy);
  margin: 0 0 0.25rem;
}

.connectivity-overlay p {
  color: var(--color-text-secondary);
  max-width: 280px;
  line-height: 1.6;
}

.connectivity-overlay .btn-retry {
  margin-top: 0.5rem;
  padding: 0.75rem 2rem;
  background: var(--color-teal);
  color: white;
  border: none;
  border-radius: 14px;
  font: 600 1rem var(--font-sans);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(11, 110, 142, 0.25);
  transition: background 0.15s, transform 0.1s;
}

.connectivity-overlay .btn-retry:hover {
  background: var(--color-teal-dark);
  transform: translateY(-1px);
}
```

- [ ] **Step 2: Create `components/connectivity-overlay.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

export function ConnectivityOverlay() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="connectivity-overlay" role="alertdialog" aria-label="No internet connection">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
        <path d="M24 34c4.4-4.4 10.4-7 16.5-7s12.1 2.6 16.5 7" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M30 41c2.8-2.8 6.6-4.5 10.5-4.5" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="40" cy="52" r="3.5" fill="var(--color-border)" />
        <line x1="20" y1="20" x2="60" y2="60" stroke="var(--color-error)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <h2>No internet connection</h2>
      <p>Check your WiFi or mobile data, then try again.</p>
      <button className="btn-retry" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Mount in `app/layout.tsx`**

Add the import and render `<ConnectivityOverlay />` as the last child of `<body>`:

```tsx
import { ConnectivityOverlay } from "@/components/connectivity-overlay";
```

```tsx
<body>
  <SiteHeader />
  <main>{children}</main>
  <SiteFooter />
  <Analytics />
  <ChatWidget />
  <ConnectivityOverlay />
</body>
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: exits 0. To test manually in dev: open browser DevTools → Network tab → set throttling to "Offline" — the overlay should appear immediately. Set back to online — it should disappear.

- [ ] **Step 5: Commit**

```bash
git add components/connectivity-overlay.tsx app/globals.css app/layout.tsx
git commit -m "feat: add connectivity overlay for offline detection with retry"
```

---

### Task 4: Toast Alert System

**Files:**
- Create: `components/toast.tsx`
- Create: `components/toast-provider.tsx`
- Modify: `app/globals.css` (append toast styles)
- Modify: `app/layout.tsx` (wrap body content in `<ToastProvider>`)

**Interfaces:**
- Produces:
  - `ToastType = 'success' | 'info' | 'warning' | 'error'`
  - `useToast(): { show: (message: string, type: ToastType) => void }`
  - `<ToastProvider>` — wraps the app, renders the toast list
- Later tasks import `useToast` from `@/components/toast-provider` to trigger toasts.

- [ ] **Step 1: Append toast CSS to `app/globals.css`**

```css
/* ── Toast alerts ──────────────────────────────────────────── */
.toast-viewport {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  color: white;
  font: 500 0.875rem var(--font-sans);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  pointer-events: all;
  animation: toast-in 0.22s ease-out;
  max-width: min(calc(100vw - 2rem), 420px);
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.toast--success { background: var(--color-success); }
.toast--info    { background: var(--color-teal); }
.toast--warning { background: var(--color-warning); }
.toast--error   { background: var(--color-error); }

.toast-message { flex: 1; }

.toast-dismiss {
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 0.25rem;
}

.toast-dismiss:hover { color: white; }
```

- [ ] **Step 2: Create `components/toast.tsx`**

```tsx
'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

const ICON: Record<ToastType, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

const AUTO_DISMISS: ToastType[] = ['success', 'info'];

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!AUTO_DISMISS.includes(type)) return;
    const t = setTimeout(() => onDismiss(id), 3000);
    return () => clearTimeout(t);
  }, [id, type, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <span aria-hidden="true">{ICON[type]}</span>
      <span className="toast-message">{message}</span>
      {!AUTO_DISMISS.includes(type) && (
        <button
          className="toast-dismiss"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/toast-provider.tsx`**

```tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastType } from '@/components/toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.slice(-3); // keep max 3 visible
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-viewport" aria-label="Notifications">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 4: Wrap `app/layout.tsx` body in `<ToastProvider>`**

Add import:

```tsx
import { ToastProvider } from "@/components/toast-provider";
```

Wrap body contents:

```tsx
<body>
  <ToastProvider>
    <SiteHeader />
    <main>{children}</main>
    <SiteFooter />
    <Analytics />
    <ChatWidget />
    <ConnectivityOverlay />
  </ToastProvider>
</body>
```

- [ ] **Step 5: Add welcome-back toast to `components/home-hero-section.tsx`**

Read the file. Find where `onAuthStateChanged` fires with a non-null user and the component switches to `HomeDashboard`. Add the toast after sign-in is confirmed:

```tsx
import { useToast } from "@/components/toast-provider";

// Inside the component:
const { show } = useToast();

// Inside the onAuthStateChanged callback, after confirming user is not null:
// (existing: setUser(u))
if (u) {
  show(`Welcome back, ${u.displayName?.split(' ')[0] || 'there'}!`, 'info');
}
```

Add the `show` call only once by using a ref flag so it doesn't re-fire on re-renders:

```tsx
const welcomedRef = useRef(false);

// Inside onAuthStateChanged:
if (u && !welcomedRef.current) {
  welcomedRef.current = true;
  show(`Welcome back, ${u.displayName?.split(' ')[0] || 'there'}!`, 'info');
}
```

- [ ] **Step 6: Build and verify**

```bash
npm run build
```

Expected: exits 0. In dev, sign in — you should see a teal "Welcome back, [name]!" pill appear at the bottom of the screen for 3 seconds.

- [ ] **Step 7: Commit**

```bash
git add components/toast.tsx components/toast-provider.tsx components/home-hero-section.tsx app/globals.css app/layout.tsx
git commit -m "feat: add toast alert system and welcome-back toast on sign-in"
```

---

### Task 5: Illustrated Empty States

**Files:**
- Create: `components/empty-state.tsx`
- Modify: `app/globals.css` (append empty state styles)
- Modify: `app/patient/appointments/page.tsx` (replace inline empty text)
- Modify: `app/patient/people/page.tsx` (replace inline empty text)

**Interfaces:**
- Consumes: nothing
- Produces: `<EmptyState illustration="calendar|chart|people|article|chat|search" title="" body="" cta?={{ label, href?, onClick? }} />`

- [ ] **Step 1: Append empty state CSS to `app/globals.css`**

```css
/* ── Empty states ──────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  gap: 0.75rem;
}

.empty-state svg {
  margin-bottom: 0.5rem;
}

.empty-state h3 {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-navy);
  margin: 0;
}

.empty-state p {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  max-width: 280px;
  margin: 0;
}

.empty-state .btn-cta {
  margin-top: 0.75rem;
  padding: 0.65rem 1.5rem;
  background: var(--color-teal);
  color: white;
  border: none;
  border-radius: 14px;
  font: 600 0.9375rem var(--font-sans);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background 0.15s, transform 0.1s;
}

.empty-state .btn-cta:hover {
  background: var(--color-teal-dark);
  transform: translateY(-1px);
}

.empty-state .btn-cta--gold {
  background: var(--color-gold);
}

.empty-state .btn-cta--gold:hover {
  background: #8C6420;
}
```

- [ ] **Step 2: Create `components/empty-state.tsx`**

```tsx
import Link from 'next/link';

type IllustrationType = 'calendar' | 'chart' | 'people' | 'article' | 'chat' | 'search' | 'wifi-off';

interface EmptyStateProps {
  illustration: IllustrationType;
  title: string;
  body: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'teal' | 'gold';
  };
}

const ILLUSTRATIONS: Record<IllustrationType, React.ReactNode> = {
  calendar: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <rect x="22" y="26" width="36" height="32" rx="4" stroke="var(--color-teal)" strokeWidth="2.5" fill="var(--color-surface)" />
      <line x1="22" y1="34" x2="58" y2="34" stroke="var(--color-teal)" strokeWidth="2" />
      <line x1="31" y1="22" x2="31" y2="30" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="49" y1="22" x2="49" y2="30" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="30" y="41" width="8" height="8" rx="2" fill="var(--color-teal-light)" stroke="var(--color-teal)" strokeWidth="1.5" />
    </svg>
  ),
  chart: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <polyline points="22,54 34,40 44,46 58,28" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="22" cy="54" r="3" fill="var(--color-teal)" />
      <circle cx="34" cy="40" r="3" fill="var(--color-teal)" />
      <circle cx="44" cy="46" r="3" fill="var(--color-teal)" />
      <circle cx="58" cy="28" r="3" fill="var(--color-gold)" />
    </svg>
  ),
  people: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <circle cx="32" cy="32" r="8" stroke="var(--color-teal)" strokeWidth="2.5" fill="var(--color-surface)" />
      <path d="M18 54c0-7.7 6.3-14 14-14" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="32" r="6" stroke="var(--color-teal)" strokeWidth="2" fill="var(--color-teal-light)" />
      <path d="M56 54c0-5.5-4.5-10-10-10" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="62" cy="46" r="8" fill="var(--color-teal)" />
      <line x1="62" y1="42" x2="62" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="46" x2="66" y2="46" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  article: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <rect x="24" y="22" width="32" height="36" rx="4" stroke="var(--color-teal)" strokeWidth="2.5" fill="var(--color-surface)" />
      <line x1="30" y1="32" x2="50" y2="32" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="39" x2="50" y2="39" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="46" x2="42" y2="46" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <rect x="20" y="24" width="36" height="26" rx="8" stroke="var(--color-teal)" strokeWidth="2.5" fill="var(--color-surface)" />
      <path d="M28 50l-6 6v-6" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <circle cx="33" cy="37" r="2.5" fill="var(--color-teal)" />
      <circle cx="40" cy="37" r="2.5" fill="var(--color-teal)" />
      <circle cx="47" cy="37" r="2.5" fill="var(--color-teal)" />
    </svg>
  ),
  search: (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <circle cx="37" cy="37" r="13" stroke="var(--color-teal)" strokeWidth="2.5" fill="var(--color-surface)" />
      <line x1="46" y1="47" x2="58" y2="59" stroke="var(--color-teal)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="37" x2="42" y2="37" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="32" x2="37" y2="42" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'wifi-off': (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="40" fill="var(--color-teal-light)" />
      <path d="M24 34c4.4-4.4 10.4-7 16.5-7s12.1 2.6 16.5 7" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 41c2.8-2.8 6.6-4.5 10.5-4.5" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="52" r="3.5" fill="var(--color-border)" />
      <line x1="20" y1="20" x2="60" y2="60" stroke="var(--color-error)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({ illustration, title, body, cta }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {ILLUSTRATIONS[illustration]}
      <h3>{title}</h3>
      <p>{body}</p>
      {cta && (
        cta.href ? (
          <Link
            href={cta.href}
            className={`btn-cta${cta.variant === 'gold' ? ' btn-cta--gold' : ''}`}
          >
            {cta.label}
          </Link>
        ) : (
          <button
            className={`btn-cta${cta.variant === 'gold' ? ' btn-cta--gold' : ''}`}
            onClick={cta.onClick}
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 3: Apply to `app/patient/appointments/page.tsx`**

Read the file. Find line 44–46 (the `{!loading && bookings.length === 0 && ...}` block). Add the import at the top of the file and replace the inline empty paragraph:

```tsx
import { EmptyState } from "@/components/empty-state";
```

Replace:
```tsx
{!loading && bookings.length === 0 && (
  <p style={{ color: "#5E7A84" }}>No appointments yet.</p>
)}
```

With:
```tsx
{!loading && bookings.length === 0 && (
  <EmptyState
    illustration="calendar"
    title="No appointments yet"
    body="Book your first session with a physio today."
    cta={{ label: 'Book Now', href: '/book', variant: 'gold' }}
  />
)}
```

- [ ] **Step 4: Apply to `app/patient/people/page.tsx`**

Read the file. Find the block around line 322–324 (the `dependents.length === 0 && !showForm` block). Add the import and replace:

```tsx
import { EmptyState } from "@/components/empty-state";
```

Replace the existing empty-state paragraph/text with:
```tsx
{dependents.length === 0 && !showForm && (
  <EmptyState
    illustration="people"
    title="Just you for now"
    body="Add a family member or friend to book appointments on their behalf."
    cta={{ label: 'Add a Person', onClick: () => setShowForm(true) }}
  />
)}
```

Note: `setShowForm` is the existing state setter already present in that component — use whatever name the file uses.

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: exits 0. In dev, visit `/patient/appointments` (with no bookings) — you should see the calendar illustration, headline, body text, and a gold "Book Now" button.

- [ ] **Step 6: Commit**

```bash
git add components/empty-state.tsx app/globals.css app/patient/appointments/page.tsx app/patient/people/page.tsx
git commit -m "feat: add illustrated empty states to appointments and people pages"
```

---

### Task 6: Confirm Dialog Component

**Files:**
- Create: `components/confirm-dialog.tsx`
- Modify: `app/globals.css` (append dialog styles)

**Interfaces:**
- Produces: `<ConfirmDialog isOpen={bool} title="" body="" confirmLabel="" confirmVariant?="default|destructive" onConfirm={() => void} onCancel={() => void} />`
- This component is wired into booking cancellation, delete-person, and sign-out flows in future work. This task delivers the component; integration is out of scope here.

- [ ] **Step 1: Append dialog CSS to `app/globals.css`**

```css
/* ── Confirm dialog ────────────────────────────────────────── */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(13, 27, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-dialog {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(13, 27, 42, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-dialog h3 {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-navy);
  margin: 0;
}

.confirm-dialog p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.confirm-dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.confirm-dialog .btn-cancel {
  padding: 0.65rem 1.25rem;
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font: 600 0.9375rem var(--font-sans);
  color: var(--color-navy);
  cursor: pointer;
  transition: border-color 0.15s;
}

.confirm-dialog .btn-cancel:hover {
  border-color: var(--color-teal);
}

.confirm-dialog .btn-confirm {
  padding: 0.65rem 1.25rem;
  background: var(--color-teal);
  border: none;
  border-radius: 10px;
  font: 600 0.9375rem var(--font-sans);
  color: white;
  cursor: pointer;
  transition: background 0.15s;
}

.confirm-dialog .btn-confirm:hover {
  background: var(--color-teal-dark);
}

.confirm-dialog .btn-confirm--destructive {
  background: var(--color-error);
}

.confirm-dialog .btn-confirm--destructive:hover {
  background: #B91C1C;
}
```

- [ ] **Step 2: Create `components/confirm-dialog.tsx`**

```tsx
'use client';

import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="confirm-dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Keep
          </button>
          <button
            className={`btn-confirm${confirmVariant === 'destructive' ? ' btn-confirm--destructive' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add components/confirm-dialog.tsx app/globals.css
git commit -m "feat: add confirm dialog component for destructive actions"
```

---

## Self-Review Checklist (run before execution)

| Spec section | Covered by task |
|---|---|
| CSS design tokens (navy, teal, gold, bg, etc.) | Task 1 |
| DM Serif Display + DM Sans fonts | Task 1 |
| Skeleton shimmer | Task 2 |
| ConnectivityOverlay with retry | Task 3 |
| Toast system (4 types, auto-dismiss, manual dismiss) | Task 4 |
| Welcome-back toast on sign-in | Task 4 |
| EmptyState illustrated component | Task 5 |
| Empty state on appointments page | Task 5 |
| Empty state on people page | Task 5 |
| ConfirmDialog component | Task 6 |
| `npm run build` must pass after each task | ✓ in every task |
