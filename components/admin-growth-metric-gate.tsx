"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { isAdminUser } from "@/lib/admin-auth";
import { auth, db } from "@/lib/firebase";
import { AdminShell } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-sign-in";
import { SkeletonRow, SkeletonStatGrid } from "@/components/skeleton";
import { AdminGrowthDayPicker, dayPhrase, useGrowthDay } from "@/components/admin-growth-day-picker";
import { contactEventTitle } from "@/lib/growth-event-labels";
import { londonDayRange } from "@/lib/growth-day";
import { eventSourceLabel } from "@/lib/traffic-source";

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
  channel?: string;
  referrerHost?: string;
  userAgent?: string;
};

type MetricConfig = {
  title: string;
  description: string;
  events?: string[];
  filter?: (event: GrowthEvent) => boolean;
  empty: string;
};

const PAGE_SIZE = 20;
/** Safety cap on one day's events; a normal day is far below it. */
const DAY_EVENT_LIMIT = 2000;

const METRICS: Record<string, MetricConfig> = {
  sessions: {
    title: "People who visited",
    description: "Everyone who used the website, counted once per phone or computer, with every page they opened and where they came from. The number is people; the list below is everything they did.",
    filter: (event) => Boolean(event.sessionId),
    empty: "No patient sessions have been tracked yet.",
  },
  "book-clicks": {
    title: "Book clicks",
    description: "Every patient click on a booking call-to-action.",
    events: ["book_now_click"],
    empty: "No booking CTA clicks have been tracked yet.",
  },
  "checkout-starts": {
    title: "Checkout starts",
    description: "Patients who reached checkout from the booking flow.",
    events: ["checkout_started"],
    empty: "No checkout starts have been tracked yet.",
  },
  confirmed: {
    title: "Confirmed bookings",
    description: "Bookings confirmed from tracked patient journeys.",
    events: ["booking_confirmed"],
    empty: "No confirmed booking events have been tracked yet.",
  },
  "exercise-views": {
    title: "Exercise views",
    description: "Exercise guide and exercise library pages viewed by patients.",
    filter: (event) =>
      event.event === "library_view" ||
      (event.event === "page_view" && event.path.startsWith("/exercises")),
    empty: "No exercise views have been tracked yet.",
  },
  "saved-exercises": {
    title: "Saved exercises",
    description: "Exercises saved by patients into a plan.",
    events: ["exercise_plan_saved"],
    empty: "No saved exercise events have been tracked yet.",
  },
  "chat-leads": {
    title: "Chat leads",
    description: "Website assistant questions and chat booking intent events.",
    events: ["chat_message_sent", "chat_booking_intent"],
    empty: "No chat leads have been tracked yet.",
  },
  "contact-taps": {
    title: "Call, WhatsApp & email taps",
    description: "Every tap on the phone number, a WhatsApp us button or an Email us button, with the page it was on. A tap opens the visitor's phone, WhatsApp or mail app; it doesn't prove they called or sent anything, so check missed calls, texts, WhatsApp and hello@ too.",
    events: ["call_click", "whatsapp_click", "email_click"],
    empty: "No phone, WhatsApp or email taps have been tracked yet.",
  },
  "visit-requests": {
    title: "Call-back requests",
    description: "Everything that happened on the \"Request a home visit\" form: who started filling it in, what stopped them (which field, never what they typed), sends that failed, and requests sent. A start with nothing after it means they gave up. The name, phone number and postcode of sent requests are in the Enquiries tab and the email to hello@.",
    events: ["visit_request_started", "visit_request_error", "visit_request_failed", "visit_request_sent"],
    empty: "No call-back requests yet.",
  },
  "page-views": {
    title: "Page views",
    description: "Every patient-side page view, newest first. Search by path to see one page.",
    events: ["page_view"],
    empty: "No page views have been tracked yet.",
  },
  "service-interest": {
    title: "Service interest",
    description: "Service page views, service card clicks and services chosen in booking.",
    events: ["service_view", "service_click", "booking_service_selected"],
    empty: "No service activity has been tracked yet.",
  },
  sources: {
    title: "Where visitors came from",
    description: "Every page view with the site or app the visit came from: a Facebook group post, Google, ChatGPT, an email link or typed in directly. Visits from Facebook's app are recognised even when it hides the link. Search \"facebook\" to see just those.",
    events: ["page_view"],
    empty: "No page views have been tracked yet.",
  },
  countries: {
    title: "Countries captured",
    description: "Patient sessions where country data was captured.",
    filter: (event) => Boolean(event.countryName || event.countryCode),
    empty: "No country data has been captured yet.",
  },
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page viewed",
  book_now_click: "Booking CTA clicked",
  checkout_started: "Checkout started",
  booking_confirmed: "Booking confirmed",
  library_view: "Exercise guide viewed",
  exercise_plan_saved: "Exercise saved to plan",
  chat_message_sent: "Patient chat message",
  chat_booking_intent: "Chat booking intent",
  service_view: "Service page viewed",
  service_click: "Service card clicked",
  booking_service_selected: "Booking service chosen",
};

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stringParam(event: GrowthEvent, key: string) {
  const value = event.params?.[key];
  return typeof value === "string" ? value : "";
}

function countryDisplay(event: GrowthEvent) {
  if (event.countryName) return event.countryName;
  if (event.countryCode) return event.countryCode;
  return "Country not captured";
}

function pageLabel(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "Home";
  if (segments[0] === "book") return "Booking";
  if (segments[0] === "pricing") return "Pricing";
  if (segments[0] === "services") return segments[1] ? `Service: ${formatLabel(segments[1])}` : "Services";
  if (segments[0] === "exercises") {
    if (segments[1] === "area" && segments[2]) return `Exercise area: ${formatLabel(segments[2])}`;
    if (segments[1] === "for" && segments[2]) return `Condition exercises: ${formatLabel(segments[2])}`;
    if (segments[1] === "tests" && segments[2]) return `Self-test: ${formatLabel(segments[2])}`;
    if (segments[1]) return `Exercise: ${formatLabel(segments[1])}`;
    return "Exercise library";
  }
  return formatLabel(segments.at(-1) ?? path);
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
  return contactEventTitle(event) ?? EVENT_LABELS[event.event] ?? formatLabel(event.event);
}

function eventDetails(event: GrowthEvent) {
  const details: string[] = [`From: ${eventSourceLabel(event)}`];
  const service = stringParam(event, "service_title") || stringParam(event, "service_slug") || stringParam(event, "service");
  if (service) details.push(`Service: ${formatLabel(service)}`);

  const exercise = stringParam(event, "exercise_title") || stringParam(event, "exercise_slug");
  if (exercise) details.push(`Exercise: ${formatLabel(exercise)}`);

  const step = stringParam(event, "step");
  if (step) details.push(`Step: ${formatLabel(step)}`);

  const slotDate = stringParam(event, "slot_date");
  if (slotDate) details.push(`Slot date: ${slotDate}`);

  const intent = stringParam(event, "intent");
  if (intent) details.push(`Intent: ${formatLabel(intent)}`);

  return details;
}

function isPatientJourneyEvent(event: GrowthEvent) {
  return !(
    event.path === "/admin" ||
    event.path.startsWith("/admin/") ||
    event.path.startsWith("/codex-") ||
    event.params?.source === "smoke_test"
  );
}

function matchesMetric(event: GrowthEvent, config: MetricConfig) {
  if (!isPatientJourneyEvent(event)) return false;
  if (config.events?.includes(event.event)) return true;
  return config.filter?.(event) ?? false;
}

export function AdminGrowthMetricGate({ metric, day }: { metric: string; day?: string }) {
  const [status, setStatus] = useState<"loading" | "out" | "forbidden" | "in">("loading");

  useEffect(() => {
    if (!auth) {
      setStatus("out");
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("out");
        return;
      }
      try {
        setStatus((await isAdminUser(user)) ? "in" : "forbidden");
      } catch {
        setStatus("out");
      }
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="admin-gate-screen admin-gate-screen-wide">
        <div className="admin-gate-card admin-gate-card-wide">
          <div className="admin-gate-icon" />
          <SkeletonStatGrid count={4} />
        </div>
      </div>
    );
  }

  if (status === "out") return <AdminSignIn />;

  if (status === "forbidden") {
    return (
      <div className="admin-gate-screen">
        <div className="admin-gate-card admin-gate-card-centered">
          <p className="admin-gate-message">This account doesn&apos;t have admin access to PhysioOnClick.</p>
          <button onClick={() => auth && signOut(auth)} className="admin-gate-button">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell backHref="/admin#growth" backLabel="← Growth">
      <main className="admin-standard-page">
        <AdminGrowthMetric metric={metric} initialDay={day} />
      </main>
    </AdminShell>
  );
}

function AdminGrowthMetric({ metric, initialDay }: { metric: string; initialDay?: string }) {
  const config = METRICS[metric];
  const { day, today, isToday, setDay } = useGrowthDay(initialDay);
  // Kept with their day, so picking another day shows loading, not stale records.
  const [loaded, setLoaded] = useState<{ day: string; events: GrowthEvent[] } | null>(null);
  const events = loaded?.day === day ? loaded.events : null;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) {
      setLoaded({ day, events: [] });
      setError("Database is not available.");
      return;
    }
    // One UK day at a time, matching the Growth tab's counts.
    let cancelled = false;
    const { startIso, endIso } = londonDayRange(day);
    async function load() {
      if (!db) return;
      try {
        const snap = await getDocs(
          query(
            collection(db, "growthEvents"),
            where("createdAtIso", ">=", startIso),
            where("createdAtIso", "<", endIso),
            orderBy("createdAtIso", "desc"),
            limit(DAY_EVENT_LIMIT),
          ),
        );
        if (cancelled) return;
        setLoaded({ day, events: snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<GrowthEvent, "id">) })) });
        setError("");
      } catch {
        if (cancelled) return;
        setLoaded({ day, events: [] });
        setError("Growth details could not be loaded. Check admin access and Firestore indexes.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [day]);

  // Keep ?day= in the address so a refresh or a shared link shows the same day.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (isToday) url.searchParams.delete("day");
    else url.searchParams.set("day", day);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [day, isToday]);

  useEffect(() => {
    setPage(1);
  }, [metric, search, day]);

  const metricEvents = useMemo(() => {
    if (!config) return [];
    return (events ?? []).filter((event) => matchesMetric(event, config));
  }, [config, events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return metricEvents;
    return metricEvents.filter((event) => {
      const haystack = [
        EVENT_LABELS[event.event],
        event.event,
        eventTitle(event),
        event.path,
        event.device,
        event.sessionId,
        event.countryName,
        event.countryCode,
        ...eventDetails(event),
        ...Object.values(event.params ?? {}).map((value) => String(value)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [metricEvents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleEvents = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);

  if (!config) {
    return (
      <section className="admin-growth-card">
        <span className="dashboard-eyebrow">Growth detail</span>
        <h1>Unknown metric</h1>
        <p className="muted">This Growth detail page does not exist.</p>
        <Link className="button button-secondary" href="/admin#growth">
          Back to Growth
        </Link>
      </section>
    );
  }

  const phrase = dayPhrase(day, today);
  // "People who visited" counts each browser once, like the Growth tab; the rest count records.
  const headCount =
    metric === "sessions" ? new Set(metricEvents.map((event) => event.sessionId)).size : metricEvents.length;

  return (
    <section className="admin-growth-detail-page">
      <div className="admin-growth-detail-head">
        <div>
          <span className="dashboard-eyebrow">Growth detail</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
          <AdminGrowthDayPicker day={day} today={today} onChange={setDay} />
        </div>
        {events === null ? null : <strong aria-label={`${headCount} ${phrase}`}>{headCount}</strong>}
      </div>

      {events === null ? <SkeletonRow count={6} /> : null}

      {metric === "chat-leads" ? (
        <Link className="button button-secondary" href="/admin/chat-logs">
          Open full chat logs
        </Link>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <input
        className="input"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`Search ${config.title.toLowerCase()} by page, source (e.g. facebook), service, exercise, country or session...`}
        aria-label={`Search ${config.title}`}
      />

      {events === null ? null : visibleEvents.length ? (
        <ul className="admin-growth-detail-list">
          {visibleEvents.map((event) => {
            const details = eventDetails(event);
            return (
              <li key={event.id}>
                <span>{EVENT_LABELS[event.event] ?? formatLabel(event.event)}</span>
                <strong>{eventTitle(event)}</strong>
                <em>{event.path}</em>
                <p className="admin-growth-detail-country">
                  <strong>Country:</strong> {countryDisplay(event)}
                </p>
                {details.length ? <p>{details.join(" · ")}</p> : null}
                <small>
                  {formatTime(event.createdAtIso)} · {event.device ?? "device"} · Session {event.sessionId ?? "not captured"}
                </small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">
          {search.trim() ? "No matching records found for this search." : isToday ? config.empty.replace(/ yet\.$/, " yet today.") : `Nothing recorded ${phrase}.`}
        </p>
      )}

      {filtered.length ? (
        <div className="admin-pagination" aria-label="Growth detail pagination">
          <span>
            Showing {pageStart + 1}-{pageEnd} of {filtered.length} records
          </span>
          <div>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </button>
            <strong>Page {currentPage} of {totalPages}</strong>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
