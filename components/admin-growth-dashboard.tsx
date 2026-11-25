"use client";

import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, BookmarkCheck, CalendarCheck2, Dumbbell, Globe2, MessageSquare, MousePointerClick, PhoneCall, Send } from "lucide-react";

import { db } from "@/lib/firebase";
import { SkeletonStatGrid } from "@/components/skeleton";
import { AdminGrowthDayPicker, dayPhrase, useGrowthDay } from "@/components/admin-growth-day-picker";
import { contactEventTitle } from "@/lib/growth-event-labels";
import { londonDayRange } from "@/lib/growth-day";
import { channelLabel, eventChannel, eventSourceLabel } from "@/lib/traffic-source";
import { ukAreaOf, visitorPlace } from "@/lib/visitor-area";

type GrowthEvent = {
  id: string;
  event: string;
  path: string;
  device?: string;
  sessionId?: string;
  countryCode?: string;
  countryName?: string;
  /** Approximate town, region and UK postcode district (from 23 Nov 2026). */
  city?: string;
  region?: string;
  postalDistrict?: string;
  connection?: string;
  createdAtIso?: string;
  params?: Record<string, unknown>;
  /** Where the visit came from (facebook, google, direct...); missing on events before 21 Nov 2026. */
  channel?: string;
  /** The referring site's host name, e.g. m.facebook.com; empty for direct visits. */
  referrerHost?: string;
  userAgent?: string;
};

/** Safety cap on one day's events; a normal day is far below it. */
const DAY_EVENT_LIMIT = 2000;

function countryLabel(event: GrowthEvent) {
  if (event.countryName) return event.countryName;
  if (event.countryCode) return event.countryCode;
  return "";
}

/** "Glasgow (G72), Scotland", or the country when no town was captured. */
function placeDisplay(event: GrowthEvent) {
  return visitorPlace(event) || countryLabel(event) || "Location not captured";
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
  { event: "quick_chat_shown", label: "Free-chat card shown" },
  { event: "quick_chat_closed", label: "Free-chat card closed" },
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
  const contactTitle = contactEventTitle(event);
  if (contactTitle) return contactTitle;
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
  const { day, today, isToday, setDay } = useGrowthDay();
  // Events are kept with the day they belong to, so another day shows loading
  // rather than the previous day's numbers.
  const [loaded, setLoaded] = useState<{ day: string; events: GrowthEvent[] } | null>(null);
  const events = loaded?.day === day ? loaded.events : null;
  const [error, setError] = useState("");

  // Counts are per UK day: midnight to midnight, so they start again from 0
  // each day. useGrowthDay follows today until another day is picked.
  useEffect(() => {
    if (!db) {
      setLoaded({ day, events: [] });
      return;
    }
    const { startIso, endIso } = londonDayRange(day);
    const q = query(
      collection(db, "growthEvents"),
      where("createdAtIso", ">=", startIso),
      where("createdAtIso", "<", endIso),
      orderBy("createdAtIso", "desc"),
      limit(DAY_EVENT_LIMIT),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        setLoaded({ day, events: snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<GrowthEvent, "id">) })) });
        setError("");
      },
      () => {
        setLoaded({ day, events: [] });
        setError("Growth tracking events could not be loaded. Check admin access and Firestore indexes.");
      },
    );
  }, [day]);

  const phrase = dayPhrase(day, today);

  const stats = useMemo(() => {
    const list = (events ?? []).filter(isPatientJourneyEvent);
    const sessionIds = new Set(list.map((event) => event.sessionId).filter(Boolean));
    const counts = new Map<string, number>();
    const pages = new Map<string, Ranked>();
    const services = new Map<string, Ranked>();
    const exercises = new Map<string, Ranked>();
    const countrySessions = new Map<string, Set<string>>();
    const sourceSessions = new Map<string, Set<string>>();
    const areaSessions = new Map<string, { label: string; ids: Set<string>; districts: Set<string> }>();
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
      if (event.sessionId) {
        const channel = eventChannel(event);
        const set = sourceSessions.get(channel) ?? new Set<string>();
        set.add(event.sessionId);
        sourceSessions.set(channel, set);
      }
      const area = event.sessionId ? ukAreaOf(event) : null;
      if (area && event.sessionId) {
        const row = areaSessions.get(area.key) ?? { label: area.label, ids: new Set<string>(), districts: new Set<string>() };
        row.ids.add(event.sessionId);
        if (area.district) row.districts.add(area.district);
        areaSessions.set(area.key, row);
      }
      if (event.event === "chat_message_sent" && stringParam(event, "message_preview")) chatQuestions.push(event);
      counts.set(event.event, (counts.get(event.event) ?? 0) + 1);
    }

    return {
      trackedSessions: sessionIds.size,
      pageViews: counts.get("page_view") ?? 0,
      bookClicks: counts.get("book_now_click") ?? 0,
      checkouts: counts.get("checkout_started") ?? 0,
      bookings: counts.get("booking_confirmed") ?? 0,
      exerciseViews: counts.get("library_view") ?? 0,
      exerciseSaves: counts.get("exercise_plan_saved") ?? 0,
      chatLeads: (counts.get("chat_booking_intent") ?? 0) + (counts.get("chat_message_sent") ?? 0),
      contactTaps:
        (counts.get("call_click") ?? 0) + (counts.get("whatsapp_click") ?? 0) + (counts.get("email_click") ?? 0),
      visitRequests: counts.get("visit_request_sent") ?? 0,
      visitRequestsStarted: counts.get("visit_request_started") ?? 0,
      // Different countries, not visitors: three people from Glasgow are one country.
      countries: countrySessions.size,
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
      ukAreas: [...areaSessions.entries()]
        .map(([key, row]) => ({
          key,
          label: row.label,
          note: row.districts.size ? `Postcode areas: ${[...row.districts].sort().join(", ")}` : `Visitors ${phrase}`,
          count: row.ids.size,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      sources: [...sourceSessions.entries()]
        .map(([channel, ids]) => ({ channel, count: ids.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    };
  }, [events, phrase]);

  const recentActivity = useMemo(() => (events ?? []).filter(isPatientJourneyEvent).slice(0, 8), [events]);

  // Detail pages open on the same day as the dashboard.
  const forDay = (href: string) => (isToday ? href : `${href}?day=${day}`);

  const head = (
    <div className="admin-growth-head">
      <div>
        <span className="dashboard-eyebrow">Growth tracking</span>
        <h2>Patient journey live view</h2>
        <p>Counts start again from 0 at midnight (UK time). Use the arrows or the date to look back at another day.</p>
      </div>
      <div className="admin-growth-head-controls">
        <AdminGrowthDayPicker day={day} today={today} onChange={setDay} />
        {isToday ? <span className="admin-growth-live"><span aria-hidden="true" /> Live</span> : null}
      </div>
    </div>
  );

  if (events === null) {
    return (
      <div className="admin-growth">
        {head}
        <SkeletonStatGrid count={3} />
      </div>
    );
  }

  return (
    <div className="admin-growth">
      {head}

      {error ? <p className="form-error">{error}</p> : null}
      {events.length >= DAY_EVENT_LIMIT ? (
        <p className="muted">This day has more than {DAY_EVENT_LIMIT} events; counts cover the latest {DAY_EVENT_LIMIT}.</p>
      ) : null}

      <div className="admin-growth-stats">
        <Link className="admin-growth-stat admin-growth-stat-link is-primary" href={forDay("/admin/growth/sessions")}>
          <Activity aria-hidden="true" />
          <span>People who visited {phrase}</span>
          <strong>{stats.trackedSessions}</strong>
          <small>{stats.pageViews === 1 ? "1 page view" : `${stats.pageViews} page views`} · see each visit</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/book-clicks")}>
          <MousePointerClick aria-hidden="true" />
          <span>Book clicks</span>
          <strong>{stats.bookClicks}</strong>
          <small>Open click records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/checkout-starts")}>
          <ArrowDownRight aria-hidden="true" />
          <span>Checkout starts</span>
          <strong>{stats.checkouts}</strong>
          <small>Open checkout records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/confirmed")}>
          <CalendarCheck2 aria-hidden="true" />
          <span>Confirmed</span>
          <strong>{stats.bookings}</strong>
          <small>Open confirmed records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/exercise-views")}>
          <Dumbbell aria-hidden="true" />
          <span>Exercise views</span>
          <strong>{stats.exerciseViews}</strong>
          <small>Open view records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/saved-exercises")}>
          <BookmarkCheck aria-hidden="true" />
          <span>Saved exercises</span>
          <strong>{stats.exerciseSaves}</strong>
          <small>Open saved records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/chat-leads")}>
          <MessageSquare aria-hidden="true" />
          <span>Chat leads</span>
          <strong>{stats.chatLeads}</strong>
          <small>Open lead records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/visit-requests")}>
          <PhoneCall aria-hidden="true" />
          <span>Call-back requests</span>
          <strong>{stats.visitRequests}</strong>
          <small>
            {stats.visitRequestsStarted
              ? `${stats.visitRequestsStarted} started the form · details in Enquiries`
              : "Details in the Enquiries tab"}
          </small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/contact-taps")}>
          <Send aria-hidden="true" />
          <span>Call, WhatsApp &amp; email taps</span>
          <strong>{stats.contactTaps}</strong>
          <small>Open tap records</small>
        </Link>
        <Link className="admin-growth-stat admin-growth-stat-link" href={forDay("/admin/growth/countries")}>
          <Globe2 aria-hidden="true" />
          <span>Countries visitors came from</span>
          <strong>{stats.countries}</strong>
          <small>{stats.countryReach[0] ? `Most from ${stats.countryReach[0].country}` : "Open country records"}</small>
        </Link>
      </div>

      <section className="admin-growth-card admin-growth-recent">
        <div className="admin-growth-card-head">
          <h3>Latest interactions</h3>
          <small>Newest first, with where each visitor came from.</small>
        </div>
        {recentActivity.length ? (
          <ul className="admin-growth-timeline">
            {recentActivity.map((event) => (
              <li key={event.id}>
                <span>{eventTitle(event)}</span>
                <em>{event.path}</em>
                <b className="admin-growth-source">From: {eventSourceLabel(event)}</b>
                <small>
                  {formatTime(event.createdAtIso)} · {event.device ?? "device"} · {placeDisplay(event)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            {isToday ? "No visitors yet today. Activity will appear here as people browse the website." : `No website activity ${phrase}.`}
          </p>
        )}
      </section>

      <div className="admin-growth-grid">
        <InsightCard title="Where visitors came from" href={forDay("/admin/growth/sources")}>
          <RankedList
            items={stats.sources.map((row) => ({ key: row.channel, label: channelLabel(row.channel), note: `Visitors ${phrase}`, count: row.count }))}
            empty="Visitor sources appear as new visits are tracked."
          />
        </InsightCard>
        <InsightCard title="Booking funnel" href={forDay("/admin/growth/book-clicks")}>
          <FunnelRows rows={stats.funnel} />
        </InsightCard>
        <InsightCard title="Exercise conversion" href={forDay("/admin/growth/exercise-views")}>
          <FunnelRows rows={stats.exerciseConversion} />
        </InsightCard>
        <InsightCard title="Top pages" href={forDay("/admin/growth/page-views")}>
          <RankedList items={stats.pages} empty="No page views recorded yet." />
        </InsightCard>
        <InsightCard title="Country reach" href={forDay("/admin/growth/countries")}>
          <RankedList
            items={stats.countryReach.map((row) => ({ key: row.country, label: row.country, note: "Unique visitor sessions", count: row.count }))}
            empty="Country appears for new visits once captured."
          />
        </InsightCard>
        <InsightCard title="UK towns and areas" href={forDay("/admin/growth/areas")}>
          <RankedList
            items={stats.ukAreas}
            empty={`No UK town captured ${phrase}. Towns are recorded from 23 Nov 2026 and are approximate.`}
          />
        </InsightCard>
        <InsightCard title="Service interest" href={forDay("/admin/growth/service-interest")}>
          <RankedList items={stats.services} empty="Service views and clicks will appear as patients browse." />
        </InsightCard>
        <InsightCard title="Exercise interest" href={forDay("/admin/growth/exercise-views")}>
          <RankedList items={stats.exercises} empty="Exercise activity will appear as patients use the library." />
        </InsightCard>
        <InsightCard title="Recent patient chat questions" href={forDay("/admin/growth/chat-leads")} wide>
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

