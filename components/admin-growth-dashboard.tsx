"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, BookmarkCheck, CalendarCheck2, Dumbbell, Globe2, MessageSquare, MousePointerClick } from "lucide-react";

import { db } from "@/lib/firebase";
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

function countryLabel(event: GrowthEvent) {
  if (event.countryName) return event.countryName;
  if (event.countryCode) return event.countryCode;
  return "";
}

function countryDisplay(event: GrowthEvent) {
  return countryLabel(event) || "Country not captured";
}

function formatLabel(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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

function stringParam(event: GrowthEvent, key: string) {
  const value = event.params?.[key];
  return typeof value === "string" ? value : "";
}

export function pageLabel(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "Home";
  if (segments[0] === "book") {
    if (segments[1] === "success") return "Booking Success";
    if (segments[1] === "receipt") return "Booking Receipt";
    return "Booking";
  }
  if (segments[0] === "pricing") return "Pricing";
  if (segments[0] === "services") return segments[1] ? `Service: ${formatLabel(segments[1])}` : "Services";
  if (segments[0] === "exercises") {
    if (segments[1] === "area" && segments[2]) return `Exercise Area: ${formatLabel(segments[2])}`;
    if (segments[1] === "for" && segments[2]) return `Condition Exercises: ${formatLabel(segments[2])}`;
    if (segments[1] === "tests" && segments[2]) return `Self-test: ${formatLabel(segments[2])}`;
    if (segments[1] === "tests") return "Self-test Library";
    if (segments[1]) return `Exercise: ${formatLabel(segments[1])}`;
    return "Exercise Library";
  }
  if (segments[0] === "blog") return segments[1] ? `Blog: ${formatLabel(segments[1])}` : "Blog";
  if (segments[0] === "patient") return "Patient Portal";
  return formatLabel(segments.at(-1) ?? path);
}

const FUNNEL: { event: string; label: string; href: string }[] = [
  { event: "book_now_click", label: "Booking CTA clicked", href: "/admin/growth/book-clicks" },
  { event: "booking_service_selected", label: "Service chosen", href: "/admin/growth/book-clicks" },
  { event: "booking_slot_selected", label: "Slot chosen", href: "/admin/growth/book-clicks" },
  { event: "checkout_started", label: "Checkout started", href: "/admin/growth/checkout-starts" },
  { event: "booking_confirmed", label: "Booking confirmed", href: "/admin/growth/confirmed" },
];

const EXERCISE_CONVERSION: { event: string; label: string }[] = [
  { event: "library_view", label: "Exercise guide viewed" },
  { event: "exercise_click", label: "Exercise opened" },
  { event: "exercise_plan_saved", label: "Saved to plan" },
  { event: "exercise_booking_intent", label: "Exercise-to-booking click" },
  { event: "saved_plan_booking_intent", label: "Saved-plan booking click" },
];

type Ranked = { key: string; label: string; note: string; count: number };

function bump(map: Map<string, Ranked>, key: string, label: string, note: string) {
  const current = map.get(key);
  map.set(key, { key, label: current?.label || label || formatLabel(key), note: current?.note ?? note, count: (current?.count ?? 0) + 1 });
}

function top(map: Map<string, Ranked>, n = 6) {
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

function exerciseSlugFromPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] !== "exercises" || segments.length !== 2 || segments[1] === "tests") return "";
  return segments[1];
}

function eventTitle(event: GrowthEvent) {
  if (event.event === "page_view") return `${pageLabel(event.path)} page viewed`;
  if (event.event === "book_now_click") {
    const service = stringParam(event, "service_title") || stringParam(event, "service_slug") || stringParam(event, "service");
    return service ? `Booking CTA clicked: ${formatLabel(service)}` : "Booking CTA clicked";
  }
  if (event.event === "library_view") {
    const title = stringParam(event, "exercise_title") || stringParam(event, "exercise_slug");
    return title ? `Exercise viewed: ${formatLabel(title)}` : "Exercise guide viewed";
  }
  if (event.event === "exercise_plan_saved") {
    const title = stringParam(event, "exercise_title") || stringParam(event, "exercise_slug");
    return title ? `Exercise saved: ${formatLabel(title)}` : "Exercise saved to plan";
  }
  if (event.event === "chat_message_sent") {
    const preview = stringParam(event, "message_preview");
    return preview ? `Patient asked: ${preview}` : "Patient chat message";
  }
  return formatLabel(event.event);
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
    const sessionCountries = new Map<string, string>();
    const counts = new Map<string, number>();
    const pages = new Map<string, Ranked>();
    const services = new Map<string, Ranked>();
    const exercises = new Map<string, Ranked>();
    const countrySessions = new Map<string, Set<string>>();
    const chatQuestions: GrowthEvent[] = [];

    for (const event of list) {
      if (event.event === "page_view") bump(pages, event.path, pageLabel(event.path), event.path);
      const serviceSlug = stringParam(event, "service_slug") || stringParam(event, "service") || stringParam(event, "service_id");
      if (serviceSlug && ["service_view", "service_click", "booking_service_selected", "book_now_click"].includes(event.event)) {
        bump(services, serviceSlug, stringParam(event, "service_title"), "Views, clicks and bookings started");
      }
      const exerciseSlug =
        stringParam(event, "exercise_slug") ||
        (event.event === "library_view" || event.event === "page_view" ? exerciseSlugFromPath(event.path) : "");
      if (exerciseSlug) bump(exercises, exerciseSlug, stringParam(event, "exercise_title"), "Views, saves and booking clicks");
      const country = countryLabel(event);
      if (country && event.sessionId) {
        const set = countrySessions.get(country) ?? new Set<string>();
        set.add(event.sessionId);
        countrySessions.set(country, set);
      }
      if (event.event === "chat_message_sent" && stringParam(event, "message_preview")) chatQuestions.push(event);
      if (event.sessionId) {
        const country = countryLabel(event);
        if (country && !sessionCountries.has(event.sessionId)) sessionCountries.set(event.sessionId, country);
      }
      counts.set(event.event, (counts.get(event.event) ?? 0) + 1);
    }

    return {
      trackedSessions: sessionIds.size,
      bookClicks: counts.get("book_now_click") ?? 0,
      checkouts: counts.get("checkout_started") ?? 0,
      bookings: counts.get("booking_confirmed") ?? 0,
      exerciseViews: counts.get("library_view") ?? 0,
      exerciseSaves: counts.get("exercise_plan_saved") ?? 0,
      chatLeads: (counts.get("chat_booking_intent") ?? 0) + (counts.get("chat_message_sent") ?? 0),
      countries: sessionCountries.size,
      funnel: FUNNEL.map((step) => ({ ...step, count: counts.get(step.event) ?? 0 })),
      exerciseConversion: EXERCISE_CONVERSION.map((step) => ({ ...step, count: counts.get(step.event) ?? 0 })),
      pages: top(pages),
      services: top(services),
      exercises: top(exercises),
      countryReach: [...countrySessions.entries()]
        .map(([country, ids]) => ({ country, count: ids.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      chatQuestions: chatQuestions.slice(0, 6),
    };
  }, [events]);

  const recentActivity = useMemo(() => (events ?? []).filter(isPatientJourneyEvent).slice(0, 8), [events]);

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
        <Link className="admin-growth-stat admin-growth-stat-link is-primary" href="/admin/growth/sessions">
          <Activity aria-hidden="true" />
          <span>Tracked visitor sessions</span>
          <strong>{stats.trackedSessions}</strong>
          <small>Review latest activity</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/book-clicks">
          <MousePointerClick aria-hidden="true" />
          <span>Book clicks</span>
          <strong>{stats.bookClicks}</strong>
          <small>Open click records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/checkout-starts">
          <ArrowDownRight aria-hidden="true" />
          <span>Checkout starts</span>
          <strong>{stats.checkouts}</strong>
          <small>Open checkout records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/confirmed">
          <CalendarCheck2 aria-hidden="true" />
          <span>Confirmed</span>
          <strong>{stats.bookings}</strong>
          <small>Open confirmed records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/exercise-views">
          <Dumbbell aria-hidden="true" />
          <span>Exercise views</span>
          <strong>{stats.exerciseViews}</strong>
          <small>Open view records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/saved-exercises">
          <BookmarkCheck aria-hidden="true" />
          <span>Saved exercises</span>
          <strong>{stats.exerciseSaves}</strong>
          <small>Open saved records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/chat-leads">
          <MessageSquare aria-hidden="true" />
          <span>Chat leads</span>
          <strong>{stats.chatLeads}</strong>
          <small>Open lead records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href="/admin/growth/countries">
          <Globe2 aria-hidden="true" />
          <span>Countries captured</span>
          <strong>{stats.countries}</strong>
          <small>Open country records</small>
        </Link>
      </div>

      <section className="admin-growth-card admin-growth-recent">
        <div className="admin-growth-card-head">
          <h3>Latest interactions</h3>
          <small>Latest patient-side events across the website.</small>
        </div>
        {recentActivity.length ? (
          <ul className="admin-growth-timeline">
            {recentActivity.map((event) => (
              <li key={event.id}>
                <span>{eventTitle(event)}</span>
                <em>{event.path}</em>
                <small>
                  {formatTime(event.createdAtIso)} · {event.device ?? "device"} · {countryDisplay(event)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Recent patient activity will appear here once visitors browse the website.</p>
        )}
      </section>

      <div className="admin-growth-grid">
        <InsightCard title="Booking funnel" href="/admin/growth/book-clicks">
          <FunnelRows rows={stats.funnel} />
        </InsightCard>
        <InsightCard title="Exercise conversion" href="/admin/growth/exercise-views">
          <FunnelRows rows={stats.exerciseConversion} />
        </InsightCard>
        <InsightCard title="Top pages" href="/admin/growth/page-views">
          <RankedList items={stats.pages} empty="No page views recorded yet." />
        </InsightCard>
        <InsightCard title="Country reach" href="/admin/growth/countries">
          <RankedList
            items={stats.countryReach.map((row) => ({ key: row.country, label: row.country, note: "Unique visitor sessions", count: row.count }))}
            empty="Country appears for new visits once captured."
          />
        </InsightCard>
        <InsightCard title="Service interest" href="/admin/growth/service-interest">
          <RankedList items={stats.services} empty="Service views and clicks will appear as patients browse." />
        </InsightCard>
        <InsightCard title="Exercise interest" href="/admin/growth/exercise-views">
          <RankedList items={stats.exercises} empty="Exercise activity will appear as patients use the library." />
        </InsightCard>
        <InsightCard title="Recent patient chat questions" href="/admin/growth/chat-leads" wide>
          {stats.chatQuestions.length ? (
            <ul className="admin-growth-timeline admin-growth-timeline--chat">
              {stats.chatQuestions.map((event) => (
                <li key={event.id}>
                  <span>{stringParam(event, "message_preview")}</span>
                  {stringParam(event, "intent") ? <em>{formatLabel(stringParam(event, "intent"))}</em> : null}
                  <small>{formatTime(event.createdAtIso)} · {event.device ?? "device"}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Patient chat questions will appear here after visitors use the assistant.</p>
          )}
        </InsightCard>
      </div>
    </div>
  );
}

function InsightCard({ title, href, wide, children }: { title: string; href: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className={`admin-growth-card${wide ? " admin-growth-card--wide" : ""}`}>
      <div className="admin-growth-card-head">
        <h3>{title}</h3>
        <Link href={href}><small>View records →</small></Link>
      </div>
      {children}
    </section>
  );
}

function FunnelRows({ rows }: { rows: { event: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="admin-growth-funnel admin-growth-funnel--compact">
      {rows.map((row) => (
        <div key={row.event} className="admin-growth-funnel-row">
          <span>{row.label}</span>
          <strong>{row.count}</strong>
          <div><span style={{ width: `${Math.round((row.count / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function RankedList({ items, empty }: { items: Ranked[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <ol className="admin-growth-list">
      {items.map((item) => (
        <li key={item.key}>
          <span><strong>{item.label}</strong><small>{item.note}</small></span>
          <b>{item.count}</b>
        </li>
      ))}
    </ol>
  );
}

