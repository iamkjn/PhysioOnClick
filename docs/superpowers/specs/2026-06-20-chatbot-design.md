# Chatbot Design — PhysioOnClick

**Date:** 2026-06-20  
**Scope:** AI-powered chatbot for the Next.js website and Flutter mobile app  
**Status:** Approved for implementation

---

## Overview

Add an AI-only chatbot powered by Google Gemini to both the website and Flutter app. The bot handles patient queries (FAQ, services, pricing), takes actions (book/cancel/reschedule appointments), and provides smart redirects (inline buttons that navigate to the right screen). It operates in two modes: public (guest users get general info) and patient-aware (logged-in users get personalised context). All conversations are persisted in Firestore. An admin panel section lets the practice owner browse and search all chat logs.

---

## Architecture

### Backend: `/api/chat` (Next.js API route)

Single API route serves both web and mobile. The Flutter app calls this endpoint over HTTPS with a Firebase ID token; the web app calls it client-side from the chat component.

**Request:**
```json
{
  "message": "Can you cancel my Tuesday session?",
  "sessionId": "abc123",
  "history": [
    { "role": "user", "text": "Hi" },
    { "role": "model", "text": "Hello! How can I help?" }
  ]
}
```

**Headers:** `Authorization: Bearer <firebaseIdToken>` (omitted for guest sessions)

**Response:**
```json
{
  "reply": "Done — your Tuesday 24 June appointment has been cancelled. Would you like to rebook?",
  "action": {
    "type": "open_booking",
    "label": "Book a new session",
    "url": "/book"
  },
  "sessionId": "abc123"
}
```

**Route logic (in order):**
1. Parse and validate request body
2. Verify Firebase ID token if present → resolve `uid`
3. If `uid` present: fetch patient's upcoming appointments, people/family, and profile from Firestore via Admin SDK
4. Build Gemini system prompt (see below)
5. Call Gemini API with conversation history + current message + function definitions
6. If Gemini invokes a function: execute it, return result to Gemini, get final reply
7. Save message + reply to Firestore `patients/{uid}/chatSessions/{sessionId}/messages`
8. Return `{ reply, action, sessionId }` to client

**Environment variable required:**
```
GEMINI_API_KEY=...
```

---

## System Prompt

The system prompt is constructed server-side per request and includes:

- Practice identity: name, location, ethos, tone (warm, professional, physio-focused)
- Full services list (from `lib/site-data.ts`)
- Pricing (from `lib/site-data.ts`)
- Cancellation policy
- FAQs from service pages
- If logged in: patient's name, upcoming appointments (date, time, service, id), people/family members
- Rules: never give medical diagnoses; recommend booking for clinical questions; be concise

---

## Gemini Function Calling

Five tools are defined and passed to Gemini. The route executes them and feeds results back.

| Tool | Arguments | What it does |
|---|---|---|
| `get_appointments` | none | Returns patient's upcoming appointments from Firestore |
| `cancel_appointment` | `appointmentId: string` | Cancels via Cal.com API (existing `CAL_API_KEY`) |
| `get_services` | none | Returns services list for recommendation context |
| `redirect` | `screen: string, label: string, url: string` | Instructs client to show a deep-link button card |
| `open_booking` | `service?: string` | Navigates patient to booking screen / Cal embed |

Guest users: `get_appointments` and `cancel_appointment` are excluded from their function list (no auth = no personal actions).

---

## Data Model (Firestore)

```
patients/{uid}/
  chatSessions/{sessionId}/
    createdAt:  timestamp
    updatedAt:  timestamp
    messages:   array of:
      {
        role:      "user" | "model"
        text:      string
        timestamp: timestamp
        action?:   { type, label, url }
      }
```

Guest sessions are not persisted — state lives in component memory only and is discarded on close.

A Firestore composite index on `(uid, updatedAt desc)` supports the admin chat log query.

---

## UI — Website (Next.js)

**Trigger:** Floating chat button, bottom-right corner, visible on all pages (guest and logged-in).

**Chat drawer:**
- Slides up from bottom-right (not a full-page navigation)
- Header: PhysioOnClick logo avatar + "Ask us anything" + close button
- Message thread: bot messages left-aligned with avatar, patient messages right-aligned in brand colour
- Inline action cards: when the API returns an `action`, a tappable card appears below the bot message (e.g. "Book a new session →")
- Text input + send button at bottom
- Loading indicator (typing dots) while awaiting Gemini response

**New component:** `components/chat-widget.tsx`  
Included once in `app/layout.tsx` so it persists across navigation.

**Guest vs logged-in:**
- Guest: chat works immediately, no login prompt; bot answers public questions only
- Logged-in: `useAuth` hook provides Firebase ID token, sent in Authorization header automatically

---

## UI — Flutter App

**Trigger:** Floating action button (bottom-right) on Home, Appointments, and Services screens.

**Chat screen:**
- Full-screen page pushed onto navigation stack (`ChatPage`)
- Same visual structure: bot messages left, patient messages right, inline action cards
- Action cards use `Navigator.pushNamed` or `app_links` for deep navigation
- Text input pinned to bottom with keyboard avoidance

**New files:**
- `lib/src/features/chat/chat_page.dart` — full-screen chat UI
- `lib/src/features/chat/chat_service.dart` — HTTP calls to `/api/chat`, auth token injection, Firestore session saving

**Auth token:** Obtained from `FirebaseAuth.instance.currentUser?.getIdToken()` and included in the Authorization header.

---

## Admin Panel — Chat Logs

**New section in `/app/admin/`:** Chat Logs page

- Lists all chat sessions across all patients, sorted by most recent
- Columns: patient name, date, message count, last message preview
- Tap to expand full thread inline
- Search bar filters by keyword across message text
- Reads from `patients/*/chatSessions` via a Firestore collection group query

No delete or edit capability in v1 — read-only.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Gemini API failure | Return a friendly fallback: "Sorry, I'm having trouble right now. Please call us or use the contact form." |
| Cancel appointment fails (Cal.com error) | Bot tells patient it couldn't cancel and offers the phone number |
| Unauthenticated request to patient-only tool | Tool excluded from guest function list — cannot be invoked |
| Firestore write failure | Log server-side, don't surface to patient (chat reply still returns) |
| Message too long (>4000 chars) | Truncate history to last 20 messages before sending to Gemini |

---

## Out of Scope (Phase 2)

- Push notification nudges (appointment reminders, follow-up prompts)
- Human agent handoff / live chat escalation
- Voice input
- Multi-language support
- Admin ability to reply on behalf of the bot

---

## Open Questions

None — all design decisions resolved.
