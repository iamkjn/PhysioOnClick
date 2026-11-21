"use client";

import { classifyTrafficSource, type TrafficSource } from "@/lib/traffic-source";

export type GrowthEventName =
  | "page_view"
  | "book_now_click"
  | "service_view"
  | "service_click"
  | "library_view"
  | "blog_saved"
  | "exercise_click"
  | "exercise_plan_saved"
  | "exercise_booking_intent"
  | "saved_plan_booking_intent"
  | "condition_click"
  | "booking_service_selected"
  | "booking_focus_selected"
  | "booking_step_completed"
  | "booking_slot_selected"
  | "booking_details_completed"
  | "assessment_started"
  | "checkout_started"
  | "discount_applied"
  | "booking_confirmed"
  | "booking_draft_saved"
  | "booking_resumed"
  | "booking_draft_discarded"
  | "chat_opened"
  | "chat_message_sent"
  | "chat_booking_intent"
  | "whatsapp_click"
  | "email_click"
  | "visit_request_sent";

export type GrowthEventParams = Record<string, string | number | boolean | null | undefined>;

const SESSION_KEY = "poc-growth-session-id";
// Per browser tab: the first page's referrer and URL say where this visit came
// from, so it's worked out once and sent with every event of the visit.
const SOURCE_KEY = "poc-growth-source";
const MAX_PARAM_KEYS = 16;

function sessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "session-unavailable";
  }
}

/** Where this visit came from (worked out once per tab); also sent with form submissions. */
export function currentVisitSource(): TrafficSource {
  try {
    const saved = window.sessionStorage.getItem(SOURCE_KEY);
    if (saved) return JSON.parse(saved) as TrafficSource;
  } catch {
    // Fall through and classify again.
  }
  const source = classifyTrafficSource({
    referrer: document.referrer,
    search: window.location.search,
    userAgent: navigator.userAgent,
    ownHost: window.location.host,
  });
  try {
    window.sessionStorage.setItem(SOURCE_KEY, JSON.stringify(source));
  } catch {
    // Private mode: classify per event instead.
  }
  return source;
}

function cleanPath(path: string) {
  if (!path) return "/";
  try {
    return new URL(path, window.location.origin).pathname || "/";
  } catch {
    return path.split("?")[0]?.slice(0, 160) || "/";
  }
}

function cleanParams(params: GrowthEventParams = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .slice(0, MAX_PARAM_KEYS)
      .map(([key, value]) => {
        if (typeof value === "string") return [key, value.slice(0, 160)];
        if (typeof value === "number" && Number.isFinite(value)) return [key, value];
        if (typeof value === "boolean") return [key, value];
        return [key, null];
      }),
  );
}

export function trackGrowthEvent(event: GrowthEventName, params?: GrowthEventParams) {
  if (typeof window === "undefined") return;
  const path = cleanPath(window.location.pathname);
  if (path === "/admin" || path.startsWith("/admin/")) return;

  const payload = {
    event,
    sessionId: sessionId(),
    path,
    referrer: document.referrer ? cleanPath(document.referrer) : "",
    ...currentVisitSource(),
    params: cleanParams(params),
  };

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/growth/track", blob)) return;
    }
  } catch {
    // Fall back to fetch below.
  }

  fetch("/api/growth/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Tracking should never disturb the user journey.
  });
}
