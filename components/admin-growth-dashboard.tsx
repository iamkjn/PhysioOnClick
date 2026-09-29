"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, CalendarCheck2, MessageSquare, MousePointerClick } from "lucide-react";

import { db } from "@/lib/firebase";
import { SkeletonStatGrid } from "@/components/skeleton";

type GrowthEvent = {
  id: string;
  event: string;
  path: string;
  device?: string;
  sessionId?: string;
  createdAtIso?: string;
  params?: Record<string, unknown>;
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page view",
  book_now_click: "Book Now click",
  service_view: "Service viewed",
  service_click: "Service clicked",
  library_view: "Library viewed",
  exercise_click: "Exercise clicked",
  condition_click: "Exercise area clicked",
  booking_service_selected: "Service selected",
  booking_focus_selected: "Focus selected",
  booking_step_completed: "Booking step done",
  booking_slot_selected: "Slot selected",
  booking_details_completed: "Details completed",
  assessment_started: "Assessment started",
  checkout_started: "Checkout started",
  discount_applied: "Discount applied",
  booking_confirmed: "Booking confirmed",
  chat_opened: "Chat opened",
  chat_message_sent: "Chat message",
  chat_booking_intent: "Chat booking intent",
};

const FUNNEL = [
  "book_now_click",
  "booking_service_selected",
  "booking_slot_selected",
  "assessment_started",
  "checkout_started",
  "booking_confirmed",
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
  return value.replaceAll("-", " ");
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

  const stats = useMemo(() => {
    const list = (events ?? []).filter(isPatientJourneyEvent);
    const sessionIds = new Set(list.map((event) => event.sessionId).filter(Boolean));
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
      if (exerciseSlug && event.event === "exercise_click") {
        bump(
          exercises,
          exerciseSlug,
          String(event.params?.exercise_title ?? ""),
          String(event.params?.body_part ?? "Exercise library"),
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

    return {
      sessions: sessionIds.size,
      events: list.length,
      bookClicks: counts.get("book_now_click") ?? 0,
      checkouts: counts.get("checkout_started") ?? 0,
      bookings: counts.get("booking_confirmed") ?? 0,
      chatLeads: (counts.get("chat_booking_intent") ?? 0) + (counts.get("chat_message_sent") ?? 0),
      funnel: FUNNEL.map((event) => ({ event, count: counts.get(event) ?? 0 })),
      pages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      services: [...services.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6),
      exercises: [...exercises.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6),
    };
  }, [events]);

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
          <p>Real-time, first-party events for reach, interest and booking conversion.</p>
        </div>
        <span className="admin-growth-live"><span aria-hidden="true" /> Live</span>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-growth-stats">
        <article className="admin-growth-stat is-primary">
          <Activity aria-hidden="true" />
          <span>Recent sessions</span>
          <strong>{stats.sessions}</strong>
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
          <MessageSquare aria-hidden="true" />
          <span>Chat leads</span>
          <strong>{stats.chatLeads}</strong>
        </article>
      </div>

      <div className="admin-growth-grid">
        <section className="admin-growth-card">
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
          <h3>Top pages</h3>
          {stats.pages.length ? (
            <ol className="admin-growth-list">
              {stats.pages.map(([path, count]) => (
                <li key={path}>
                  <span><strong>{lastPathSegment(path)}</strong><small>{path}</small></span>
                  <b>{count}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">No page views recorded yet.</p>}
        </section>

        <section className="admin-growth-card">
          <h3>Service clicks</h3>
          {stats.services.length ? (
            <ol className="admin-growth-list">
              {stats.services.map(([slug, item]) => (
                <li key={slug}>
                  <span><strong>{item.label}</strong><small>{item.note}</small></span>
                  <b>{item.count}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">Service clicks will appear as patients browse.</p>}
        </section>

        <section className="admin-growth-card">
          <h3>Exercise clicks</h3>
          {stats.exercises.length ? (
            <ol className="admin-growth-list">
              {stats.exercises.map(([slug, item]) => (
                <li key={slug}>
                  <span><strong>{item.label}</strong><small>{item.note}</small></span>
                  <b>{item.count}</b>
                </li>
              ))}
            </ol>
          ) : <p className="muted">Exercise clicks will appear as patients use the library.</p>}
        </section>

        <section className="admin-growth-card">
          <h3>Latest interactions</h3>
          {patientEvents.length ? (
            <ul className="admin-growth-timeline">
              {patientEvents.slice(0, 12).map((event) => (
                <li key={event.id}>
                  <span>{EVENT_LABELS[event.event] ?? event.event}</span>
                  <strong>{event.path}</strong>
                  <small>{formatTime(event.createdAtIso)} · {event.device ?? "device"}</small>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Events will appear here as soon as people use the site.</p>}
        </section>
      </div>
    </div>
  );
}
