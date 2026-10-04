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

    for (const event of list) {
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
    };
  }, [events]);

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

    </div>
  );
}
