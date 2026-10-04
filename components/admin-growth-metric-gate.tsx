"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { isAdminUser } from "@/lib/admin-auth";
import { auth, db } from "@/lib/firebase";
import { AdminShell } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-sign-in";
import { SkeletonRow, SkeletonStatGrid } from "@/components/skeleton";

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

type MetricConfig = {
  title: string;
  description: string;
  events?: string[];
  filter?: (event: GrowthEvent) => boolean;
  empty: string;
};

const PAGE_SIZE = 20;

const METRICS: Record<string, MetricConfig> = {
  sessions: {
    title: "Tracked visitor sessions",
    description: "Unique patient-side browser sessions, grouped from recent website activity.",
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
  return EVENT_LABELS[event.event] ?? formatLabel(event.event);
}

function eventDetails(event: GrowthEvent) {
  const details: string[] = [];
  const service = stringParam(event, "service_title") || stringParam(event, "service_slug") || stringParam(event, "service");
  if (service) details.push(`Service: ${formatLabel(service)}`);

  const exercise = stringParam(event, "exercise_title") || stringParam(event, "exercise_slug");
  if (exercise) details.push(`Exercise: ${formatLabel(exercise)}`);

  const step = stringParam(event, "step");
  if (step) details.push(`Step: ${formatLabel(step)}`);

  const slotDate = stringParam(event, "slot_date");
  if (slotDate) details.push(`Slot date: ${slotDate}`);

  const country = event.countryName || event.countryCode;
  if (country) details.push(`Country: ${country}`);

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

export function AdminGrowthMetricGate({ metric }: { metric: string }) {
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
    <AdminShell backHref="/admin" backLabel="← Dashboard">
      <main className="admin-standard-page">
        <AdminGrowthMetric metric={metric} />
      </main>
    </AdminShell>
  );
}

function AdminGrowthMetric({ metric }: { metric: string }) {
  const config = METRICS[metric];
  const [events, setEvents] = useState<GrowthEvent[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) {
      setEvents([]);
      setError("Database is not available.");
      return;
    }
    async function load() {
      if (!db) return;
      try {
        const snap = await getDocs(query(collection(db, "growthEvents"), orderBy("createdAtIso", "desc"), limit(500)));
        setEvents(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<GrowthEvent, "id">) })));
        setError("");
      } catch {
        setEvents([]);
        setError("Growth details could not be loaded. Check admin access and Firestore indexes.");
      }
    }
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [metric, search]);

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
        <Link className="button button-secondary" href="/admin">
          Back to Growth
        </Link>
      </section>
    );
  }

  if (events === null) return <SkeletonRow count={6} />;

  return (
    <section className="admin-growth-detail-page">
      <div className="admin-growth-detail-head">
        <div>
          <span className="dashboard-eyebrow">Growth detail</span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <strong>{metricEvents.length}</strong>
      </div>

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
        placeholder={`Search ${config.title.toLowerCase()} by page, service, exercise, country or session...`}
        aria-label={`Search ${config.title}`}
      />

      {visibleEvents.length ? (
        <ul className="admin-growth-detail-list">
          {visibleEvents.map((event) => {
            const details = eventDetails(event);
            return (
              <li key={event.id}>
                <span>{EVENT_LABELS[event.event] ?? formatLabel(event.event)}</span>
                <strong>{eventTitle(event)}</strong>
                <em>{event.path}</em>
                {details.length ? <p>{details.join(" · ")}</p> : null}
                <small>
                  {formatTime(event.createdAtIso)} · {event.device ?? "device"} · Session {event.sessionId ?? "not captured"}
                </small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">{search.trim() ? "No matching records found for this search." : config.empty}</p>
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
