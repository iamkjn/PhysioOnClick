"use client";

import { collection, collectionGroup, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, BookmarkCheck, CalendarCheck2, Dumbbell, Globe2, MessageSquare, MousePointerClick } from "lucide-react";

import { db } from "@/lib/firebase";
import { formatPersonName } from "@/lib/name-format";
import { pricing } from "@/lib/site-data";
import { SkeletonStatGrid } from "@/components/skeleton";

type GrowthEvent = {
  id: string;
  event: string;
  path: string;
  device?: string;
  sessionId?: string;
  countryCode?: string;
  countryName?: string;
  createdAtIso?: string;
  params?: Record<string, unknown>;
};

type ChatMessage = {
  role: "user" | "model";
  text: string;
  timestamp?: string;
};

type ChatSession = {
  sessionId: string;
  patientId: string;
  patientName: string;
  updatedAt?: { seconds: number };
  messages: ChatMessage[];
};

type ChatQuestion = {
  id: string;
  question: string;
  source: string;
  device: string;
  createdAtIso?: string;
  sortAt: number;
  intent?: string;
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  book_now_click: "Booking CTA clicked",
  service_view: "Service page viewed",
  service_click: "Service card clicked",
  library_view: "Exercise guide viewed",
  exercise_click: "Exercise opened",
  exercise_plan_saved: "Exercise saved to plan",
  exercise_booking_intent: "Exercise-to-booking click",
  saved_plan_booking_intent: "Saved-plan booking click",
  condition_click: "Condition programme opened",
  booking_service_selected: "Booking service chosen",
  booking_focus_selected: "Booking focus chosen",
  booking_step_completed: "Booking step completed",
  booking_slot_selected: "Booking slot chosen",
  booking_details_completed: "Patient details completed",
  assessment_started: "Assessment form started",
  checkout_started: "Checkout started",
  discount_applied: "Discount applied",
  booking_confirmed: "Booking confirmed",
  chat_opened: "Chat opened",
  chat_message_sent: "Patient chat message",
  chat_booking_intent: "Chat booking intent captured",
};

const SERVICE_LABELS = Object.fromEntries(pricing.map((item) => [item.id, item.title]));

const BOOKING_STEP_LABELS: Record<string, string> = {
  service: "Step 1 completed: service selected",
  details: "Step 2 completed: time and patient details",
  assessment: "Step 3 started: assessment form",
  checkout: "Step 4 started: checkout",
};

const FUNNEL = [
  "book_now_click",
  "booking_service_selected",
  "booking_slot_selected",
  "checkout_started",
  "booking_confirmed",
];

const EXERCISE_CONVERSION = [
  "library_view",
  "exercise_click",
  "exercise_plan_saved",
  "exercise_booking_intent",
  "saved_plan_booking_intent",
  "checkout_started",
];

function formatTime(value?: string) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lastPathSegment(path: string) {
  const segment = path.split("/").filter(Boolean).pop();
  return segment ? segment.replaceAll("-", " ") : "Home";
}

function formatLabel(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Readable page name for a tracked path, e.g. "/" -> "Home", "/book" -> "Booking". */
export function pageLabel(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "Home";

  if (segments[0] === "book") {
    if (segments[1] === "success") return "Booking Success";
    if (segments[1] === "receipt") return "Booking Receipt";
    return "Booking";
  }
  if (segments[0] === "services") {
    return segments[1] ? `Service: ${formatLabel(segments[1])}` : "Services";
  }
  if (segments[0] === "exercises") {
    if (segments[1] === "area" && segments[2]) return `Exercise Area: ${formatLabel(segments[2])}`;
    if (segments[1] === "for" && segments[2]) return `Condition Exercises: ${formatLabel(segments[2])}`;
    if (segments[1] === "tests" && segments[2]) return `Self-test: ${formatLabel(segments[2])}`;
    if (segments[1] === "tests") return "Self-test Library";
    if (segments[1]) return `Exercise: ${formatLabel(segments[1])}`;
    return "Exercise Library";
  }
  if (segments[0] === "blog") {
    return segments[1] ? `Blog: ${formatLabel(segments[1])}` : "Blog";
  }
  if (segments[0] === "patient") return "Patient Portal";

  return formatLabel(lastPathSegment(path));
}

function stringParam(event: GrowthEvent, key: string) {
  const value = event.params?.[key];
  return typeof value === "string" ? value : "";
}

function numberParam(event: GrowthEvent, key: string) {
  const value = event.params?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function chatPreview(event: GrowthEvent) {
  return stringParam(event, "message_preview");
}

function serviceName(value: string) {
  return SERVICE_LABELS[value] ?? formatLabel(value);
}

function countryLabel(event: GrowthEvent) {
  if (event.countryName) return event.countryName;
  if (event.countryCode) return event.countryCode;
  return "";
}

function eventTitle(event: GrowthEvent) {
  if (event.event === "page_view") {
    return `${pageLabel(event.path)} page viewed`;
  }
  if (event.event === "booking_step_completed") {
    const step = stringParam(event, "step");
    return BOOKING_STEP_LABELS[step] ?? `Booking step completed${step ? `: ${formatLabel(step)}` : ""}`;
  }
  if (event.event === "booking_service_selected") {
    const id = stringParam(event, "service_id");
    return id ? `Booking service selected: ${serviceName(id)}` : "Booking service selected";
  }
  if (event.event === "booking_slot_selected") return "Booking slot selected";
  if (event.event === "booking_details_completed") return "Patient details completed";
  if (event.event === "assessment_started") return "Assessment form started";
  if (event.event === "checkout_started") return "Checkout started";
  if (event.event === "discount_applied") return `Discount applied${stringParam(event, "discount_code") ? `: ${stringParam(event, "discount_code")}` : ""}`;
  if (event.event === "book_now_click") {
    const service = stringParam(event, "service_title") || stringParam(event, "service_slug") || stringParam(event, "service");
    return service ? `Booking CTA clicked: ${formatLabel(service)}` : "Booking CTA clicked";
  }
  if (event.event === "library_view" || event.event === "exercise_click") {
    const title = stringParam(event, "exercise_title") || stringParam(event, "exercise_slug") || exerciseSlugFromPath(event.path);
    return title ? `Exercise viewed: ${formatLabel(title)}` : EVENT_LABELS[event.event] ?? event.event;
  }
  if (event.event === "service_view" || event.event === "service_click") {
    const title = stringParam(event, "service_title") || stringParam(event, "service_slug");
    return title ? `Service viewed: ${formatLabel(title)}` : EVENT_LABELS[event.event] ?? event.event;
  }
  if (event.event === "chat_message_sent") {
    const preview = chatPreview(event);
    return preview ? `Patient asked: ${preview}` : "Patient chat message";
  }
  return EVENT_LABELS[event.event] ?? formatLabel(event.event);
}

function eventDetails(event: GrowthEvent) {
  const details: string[] = [];
  const serviceId = stringParam(event, "service_id");
  const service = stringParam(event, "service_title") || stringParam(event, "service_slug") || stringParam(event, "service");
  if (serviceId) details.push(`Service: ${serviceName(serviceId)}`);
  else if (service) details.push(`Service: ${formatLabel(service)}`);

  const step = stringParam(event, "step");
  if (step) details.push(`Step key: ${step}`);

  const focusAreas = numberParam(event, "focus_areas");
  if (focusAreas !== null) details.push(`Focus areas: ${focusAreas}`);
  const focusArea = stringParam(event, "focus_area");
  if (focusArea) details.push(`Focus: ${focusArea}`);

  const slotDate = stringParam(event, "slot_date");
  if (slotDate) details.push(`Slot date: ${slotDate}`);

  const amount = numberParam(event, "amount_pence");
  if (amount !== null) details.push(`Amount: £${(amount / 100).toFixed(2)}`);

  const discount = stringParam(event, "discount_code");
  if (discount) details.push(`Discount: ${discount}`);

  const exercise = stringParam(event, "exercise_title") || stringParam(event, "exercise_slug");
  if (exercise) details.push(`Exercise: ${formatLabel(exercise)}`);

  const condition = stringParam(event, "condition_name") || stringParam(event, "condition_slug");
  if (condition) details.push(`Condition: ${formatLabel(condition)}`);

  if (event.event === "chat_message_sent") {
    const intent = stringParam(event, "intent");
    const length = numberParam(event, "message_length");
    if (intent) details.push(`Intent: ${formatLabel(intent)}`);
    if (length !== null) details.push(`${length} characters`);
  }

  if (typeof event.params?.for_dependent === "boolean") {
    details.push(event.params.for_dependent ? "For dependent" : "For account holder");
  }

  return details;
}

function exerciseSlugFromPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] !== "exercises" || segments.length !== 2) return "";
  if (["area", "for", "tests", "how-we-make-this"].includes(segments[1])) return "";
  return segments[1];
}

function isPatientJourneyEvent(event: GrowthEvent) {
  return !(
    event.path === "/admin" ||
    event.path.startsWith("/admin/") ||
    event.path.startsWith("/codex-") ||
    event.params?.source === "smoke_test"
  );
}

export function AdminGrowthDashboard() {
  const [events, setEvents] = useState<GrowthEvent[] | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) {
      setEvents([]);
      return;
    }
    const q = query(collection(db, "growthEvents"), orderBy("createdAtIso", "desc"), limit(220));
    return onSnapshot(
      q,
      (snapshot) => {
        setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<GrowthEvent, "id">) })));
        setError("");
      },
      () => {
        setEvents([]);
        setError("Growth tracking events could not be loaded. Check admin access and Firestore indexes.");
      },
    );
  }, []);

  useEffect(() => {
    if (!db) return;
    let cancelled = false;

    async function loadChatHistory() {
      if (!db) return;
      const database = db;
      try {
        const q = query(collectionGroup(database, "chatSessions"), orderBy("updatedAt", "desc"), limit(40));
        const snap = await getDocs(q);
        const patientIds = Array.from(new Set(snap.docs.map((sessionDoc) => sessionDoc.ref.parent.parent?.id ?? "")));
        const patientNameCache = new Map<string, string>();

        await Promise.all(
          patientIds.map(async (patientId) => {
            if (!patientId) return;
            let patientName = patientId;
            try {
              const patientSnap = await getDoc(doc(database, "patients", patientId));
              if (patientSnap.exists()) {
                patientName = formatPersonName(patientSnap.data().displayName as string | undefined, patientId);
              }
            } catch {
              // Non-fatal: show the patient id if the name lookup fails.
            }
            patientNameCache.set(patientId, patientName);
          }),
        );

        const results: ChatSession[] = snap.docs.map((sessionDoc) => {
          const patientId = sessionDoc.ref.parent.parent?.id ?? "";
          const data = sessionDoc.data();
          return {
            sessionId: sessionDoc.id,
            patientId,
            patientName: formatPersonName(patientNameCache.get(patientId), patientId || "Patient"),
            updatedAt: data.updatedAt,
            messages: Array.isArray(data.messages) ? (data.messages as ChatMessage[]) : [],
          };
        });

        if (!cancelled) setChatSessions(results);
      } catch {
        if (!cancelled) setChatSessions([]);
      }
    }

    loadChatHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const list = (events ?? []).filter(isPatientJourneyEvent);
    const sessionIds = new Set(list.map((event) => event.sessionId).filter(Boolean));
    const sessionEventCounts = new Map<string, number>();
    const sessionCountries = new Map<string, string>();
    const counts = new Map<string, number>();
    const pages = new Map<string, number>();
    const services = new Map<string, { label: string; count: number; note: string }>();
    const exercises = new Map<string, { label: string; count: number; note: string }>();

    const bump = (
      map: Map<string, { label: string; count: number; note: string }>,
      key: string,
      label: string,
      note: string,
    ) => {
      const current = map.get(key);
      map.set(key, {
        label: label || formatLabel(key),
        note,
        count: (current?.count ?? 0) + 1,
      });
    };

    for (const event of list) {
      if (event.sessionId) {
        sessionEventCounts.set(event.sessionId, (sessionEventCounts.get(event.sessionId) ?? 0) + 1);
        const country = countryLabel(event);
        if (country && !sessionCountries.has(event.sessionId)) sessionCountries.set(event.sessionId, country);
      }
      counts.set(event.event, (counts.get(event.event) ?? 0) + 1);
      if (event.event === "page_view") pages.set(event.path, (pages.get(event.path) ?? 0) + 1);
      const serviceSlug = String(event.params?.service_slug ?? event.params?.service ?? "");
      if (
        serviceSlug &&
        (event.event === "service_click" ||
          event.event === "service_view" ||
          event.event === "booking_service_selected" ||
          event.event === "book_now_click")
      ) {
        bump(
          services,
          serviceSlug,
          String(event.params?.service_title ?? ""),
          event.event === "service_click" ? "Clicked by patient" : EVENT_LABELS[event.event] ?? "Service activity",
        );
      }

      const exerciseSlug = String(event.params?.exercise_slug ?? "");
      if (exerciseSlug && ["exercise_click", "exercise_plan_saved", "exercise_booking_intent"].includes(event.event)) {
        bump(
          exercises,
          exerciseSlug,
          String(event.params?.exercise_title ?? ""),
          event.event === "exercise_booking_intent"
            ? "Clicked booking from exercise"
            : event.event === "exercise_plan_saved"
              ? "Saved to plan"
              : String(event.params?.body_part ?? "Exercise library"),
        );
      }

      const viewedExerciseSlug =
        event.event === "library_view" || event.event === "page_view"
          ? String(event.params?.slug ?? "") || exerciseSlugFromPath(event.path)
          : "";
      if (viewedExerciseSlug) {
        bump(
          exercises,
          viewedExerciseSlug,
          "",
          event.event === "library_view" ? "Exercise guide viewed" : "Exercise page viewed",
        );
      }

      const conditionSlug = String(event.params?.condition_slug ?? "");
      if (conditionSlug && event.event === "condition_click") {
        bump(
          exercises,
          conditionSlug,
          String(event.params?.condition_name ?? ""),
          String(event.params?.body_part ?? "Exercise programme"),
        );
      }
    }

    const sessionCounts = [...sessionEventCounts.values()];
    const countries = new Map<string, number>();
    for (const country of sessionCountries.values()) {
      countries.set(country, (countries.get(country) ?? 0) + 1);
    }

    const chatFromGrowth: ChatQuestion[] = list
      .filter((event) => event.event === "chat_message_sent")
      .map((event) => ({
        id: event.id,
        question: chatPreview(event) || "Question preview was not captured for this older chat event.",
        source: "Website assistant",
        device: event.device ?? "device",
        createdAtIso: event.createdAtIso,
        sortAt: event.createdAtIso ? new Date(event.createdAtIso).getTime() : 0,
        intent: stringParam(event, "intent"),
      }));

    const chatFromHistory: ChatQuestion[] = chatSessions.flatMap((session) =>
      session.messages
        .map((message, index) => ({ message, index }))
        .filter(({ message }) => message.role === "user" && message.text.trim())
        .map(({ message, index }) => ({
          id: `${session.sessionId}-${index}`,
          question: message.text.replace(/\s+/g, " ").trim().slice(0, 220),
          source: session.patientName,
          device: "logged-in patient",
          createdAtIso: message.timestamp,
          sortAt: message.timestamp
            ? new Date(message.timestamp).getTime()
            : session.updatedAt?.seconds
              ? session.updatedAt.seconds * 1000
              : 0,
        })),
    );

    return {
      trackedSessions: sessionIds.size,
      analysedEvents: list.length,
      engagedSessions: sessionCounts.filter((count) => count >= 2).length,
      singleEventSessions: sessionCounts.filter((count) => count === 1).length,
      countrySessions: sessionCountries.size,
      bookClicks: counts.get("book_now_click") ?? 0,
      checkouts: counts.get("checkout_started") ?? 0,
      bookings: counts.get("booking_confirmed") ?? 0,
      exerciseViews: counts.get("library_view") ?? 0,
      exerciseSaves: counts.get("exercise_plan_saved") ?? 0,
      exerciseBookingClicks: counts.get("exercise_booking_intent") ?? 0,
      chatLeads: (counts.get("chat_booking_intent") ?? 0) + (counts.get("chat_message_sent") ?? 0),
      funnel: FUNNEL.map((event) => ({ event, count: counts.get(event) ?? 0 })),
      exerciseConversion: EXERCISE_CONVERSION.map((event) => ({ event, count: counts.get(event) ?? 0 })),
      pages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      services: [...services.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6),
      exercises: [...exercises.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6),
      countries: [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      chatQuestions: [...chatFromGrowth, ...chatFromHistory]
        .sort((a, b) => b.sortAt - a.sortAt)
        .slice(0, 10),
    };
  }, [events, chatSessions]);

  const patientEvents = useMemo(() => (events ?? []).filter(isPatientJourneyEvent), [events]);

  if (events === null) {
    return <SkeletonStatGrid count={3} />;
  }

  return (
    <div className="admin-growth">
      <div className="admin-growth-head">
        <div>
          <span className="dashboard-eyebrow">Growth tracking</span>
          <h2>Patient journey live view</h2>
          <p>Real-time, first-party patient events for reach, interest and booking conversion.</p>
        </div>
        <span className="admin-growth-live"><span aria-hidden="true" /> Live</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-growth-stats">
        <article className="admin-growth-stat is-primary">
          <Activity aria-hidden="true" />
          <span>Tracked visitor sessions</span>
          <strong>{stats.trackedSessions}</strong>
          <small>Unique browser sessions in the latest event window.</small>
        </article>
        <article className="admin-growth-stat">
          <MousePointerClick aria-hidden="true" />
          <span>Book clicks</span>
          <strong>{stats.bookClicks}</strong>
        </article>
        <article className="admin-growth-stat">
          <ArrowDownRight aria-hidden="true" />
          <span>Checkout starts</span>
          <strong>{stats.checkouts}</strong>
        </article>
        <article className="admin-growth-stat">
          <CalendarCheck2 aria-hidden="true" />
          <span>Confirmed</span>
          <strong>{stats.bookings}</strong>
        </article>
        <article className="admin-growth-stat">
          <Dumbbell aria-hidden="true" />
          <span>Exercise views</span>
          <strong>{stats.exerciseViews}</strong>
        </article>
        <article className="admin-growth-stat">
          <BookmarkCheck aria-hidden="true" />
          <span>Saved exercises</span>
          <strong>{stats.exerciseSaves}</strong>
        </article>
        <article className="admin-growth-stat">
          <MessageSquare aria-hidden="true" />
          <span>Chat leads</span>
          <strong>{stats.chatLeads}</strong>
        </article>
        <article className="admin-growth-stat">
          <Globe2 aria-hidden="true" />
          <span>Countries captured</span>
          <strong>{stats.countries.length}</strong>
        </article>
      </div>

      <div className="admin-growth-grid">
        <section className="admin-growth-card admin-growth-card--wide">
          <h3>Latest interactions</h3>
          {patientEvents.length ? (
            <ul className="admin-growth-timeline">
              {patientEvents.slice(0, 12).map((event) => {
                const details = eventDetails(event);
                return (
                  <li key={event.id}>
                    <span>{eventTitle(event)}</span>
                    <strong>{event.event === "page_view" ? pageLabel(event.path) : event.path}</strong>
                    {details.length ? <em>{details.join(" · ")}</em> : null}
                    <small>{formatTime(event.createdAtIso)} · {event.device ?? "device"}</small>
                  </li>
                );
              })}
            </ul>
          ) : <p className="muted">Events will appear here as soon as people use the site.</p>}
        </section>

        <section className="admin-growth-card admin-growth-card--wide">
          <h3>Recent patient chat questions</h3>
          {stats.chatQuestions.length ? (
            <ul className="admin-growth-timeline admin-growth-timeline--chat">
              {stats.chatQuestions.map((chat) => (
                <li key={chat.id}>
                  <span>{chat.question}</span>
                  <strong>{chat.source}</strong>
                  {chat.intent ? <em>{formatLabel(chat.intent)}</em> : null}
                  <small>{formatTime(chat.createdAtIso)} · {chat.device}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Patient chat questions will appear here after new website visitors use the assistant.
            </p>
          )}
        </section>
      </div>

      <section className="admin-growth-card admin-growth-basis">
        <div>
          <h3>Why this number shows</h3>
          <p className="muted">
            Tracked visitor sessions are unique browser session IDs from recent patient-side events. It is not a click
            count, so a person who only opens one page can still count as one session.
          </p>
        </div>
        <ol className="admin-growth-list">
          <li><span><strong>Patient events analysed</strong><small>Latest tracked website activity loaded here</small></span><b>{stats.analysedEvents}</b></li>
          <li><span><strong>Unique visitor sessions</strong><small>Basis for the headline number</small></span><b>{stats.trackedSessions}</b></li>
          <li><span><strong>Engaged sessions</strong><small>Sessions with 2 or more tracked events</small></span><b>{stats.engagedSessions}</b></li>
          <li><span><strong>Single-event sessions</strong><small>Likely quick visits, refreshes or one-page views</small></span><b>{stats.singleEventSessions}</b></li>
          <li><span><strong>Country-known sessions</strong><small>New events only, after country capture is live</small></span><b>{stats.countrySessions}</b></li>
        </ol>
      </section>

      <div className="admin-growth-grid">
        <section className="admin-growth-card admin-growth-card--span">
          <h3>Booking funnel</h3>
          <div className="admin-growth-funnel">
            {stats.funnel.map((item) => (
              <div key={item.event} className="admin-growth-funnel-row">
                <span>{EVENT_LABELS[item.event]}</span>
                <strong>{item.count}</strong>
                <div><span style={{ width: `${Math.min(100, item.count * 18)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-growth-card">
          <h3>Exercise conversion</h3>
          <div className="admin-growth-funnel admin-growth-funnel--compact">
            {stats.exerciseConversion.map((item) => (
              <div key={item.event} className="admin-growth-funnel-row">
                <span>{EVENT_LABELS[item.event]}</span>
                <strong>{item.count}</strong>
                <div><span style={{ width: `${Math.min(100, item.count * 18)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-growth-card">
          <h3>Top pages</h3>
          {stats.pages.length ? (
            <ol className="admin-growth-list">
              {stats.pages.map(([path, count]) => (
                <li key={path}>
                  <span><strong>{pageLabel(path)}</strong><small>{path}</small></span>
                  <b>{count}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">No page views recorded yet.</p>}
        </section>

        <section className="admin-growth-card">
          <h3>Country reach</h3>
          {stats.countries.length ? (
            <ol className="admin-growth-list admin-growth-country-list">
              {stats.countries.map(([country, count]) => (
                <li key={country}>
                  <span><strong>{country}</strong><small>Unique visitor sessions</small></span>
                  <b>{count}</b>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Country will appear for new patient visits after this update is deployed.</p>
          )}
        </section>

        <section className="admin-growth-card">
          <h3>Service interest</h3>
          {stats.services.length ? (
            <ol className="admin-growth-list">
              {stats.services.map(([slug, item]) => (
                <li key={slug}>
                  <span><strong>{item.label}</strong><small>{item.note}</small></span>
                  <b>{item.count}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">Service views and clicks will appear as patients browse.</p>}
        </section>

        <section className="admin-growth-card">
          <h3>Exercise interest</h3>
          {stats.exercises.length ? (
            <ol className="admin-growth-list">
              {stats.exercises.map(([slug, item]) => (
                <li key={slug}>
                  <span><strong>{item.label}</strong><small>{item.note}</small></span>
                  <b>{item.count}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">Exercise views and clicks will appear as patients use the library.</p>}
        </section>
      </div>
    </div>
  );
}
