import { NextResponse } from "next/server";

import { FieldValue, getAdminDb } from "@/lib/firebase-admin";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "book_now_click",
  "service_view",
  "service_click",
  "library_view",
  "blog_saved",
  "exercise_click",
  "exercise_plan_saved",
  "exercise_booking_intent",
  "saved_plan_booking_intent",
  "condition_click",
  "booking_service_selected",
  "booking_focus_selected",
  "booking_step_completed",
  "booking_slot_selected",
  "booking_details_completed",
  "assessment_started",
  "checkout_started",
  "discount_applied",
  "booking_confirmed",
  "chat_opened",
  "chat_message_sent",
  "chat_booking_intent",
]);

const SAFE_PARAM_KEYS = new Set([
  "source",
  "slug",
  "service_id",
  "service_slug",
  "service_title",
  "blog_slug",
  "blog_title",
  "service",
  "exercise_id",
  "exercise_slug",
  "exercise_title",
  "saved_count",
  "booking_context",
  "origin",
  "condition_slug",
  "condition_name",
  "body_part",
  "stage",
  "focus_area",
  "focus_areas",
  "step",
  "slot_date",
  "for_dependent",
  "discount_code",
  "discount_percent",
  "amount_pence",
  "message_length",
  "message_preview",
  "intent",
]);

function cleanString(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPath(value: unknown) {
  const raw = cleanString(value, 220);
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  return raw.split("?")[0]?.slice(0, 180) || "/";
}

function cleanSessionId(value: unknown) {
  const raw = cleanString(value, 80);
  return /^[a-zA-Z0-9._:-]{8,80}$/.test(raw) ? raw : "";
}

function cleanParams(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: Record<string, string | number | boolean | null> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (!SAFE_PARAM_KEYS.has(key)) continue;
    if (typeof raw === "string") output[key] = raw.trim().slice(0, 160);
    else if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
    else if (typeof raw === "boolean") output[key] = raw;
    else output[key] = null;
  }

  return output;
}

function deviceFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

function countryFromHeaders(headers: Headers) {
  const code = cleanString(
    headers.get("x-vercel-ip-country") ||
      headers.get("cf-ipcountry") ||
      headers.get("cloudfront-viewer-country") ||
      headers.get("x-country-code"),
    8,
  ).toUpperCase();

  if (!/^[A-Z]{2}$/.test(code) || code === "XX") {
    return { countryCode: "", countryName: "" };
  }

  try {
    const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
    return { countryCode: code, countryName };
  } catch {
    return { countryCode: code, countryName: code };
  }
}

function shouldIgnorePath(path: string) {
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/codex-");
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (await isRateLimited("CHAT_RATE_LIMITER", `growth:${ip}`)) {
    return NextResponse.json({ ok: true, saved: false, reason: "rate-limited" });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid tracking payload." }, { status: 400 });
  }

  const event = cleanString(body.event, 64);
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "Unknown tracking event." }, { status: 400 });
  }

  const sessionId = cleanSessionId(body.sessionId);
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }
  const path = cleanPath(body.path);
  if (shouldIgnorePath(path)) {
    return NextResponse.json({ ok: true, saved: false, reason: "internal-path" });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ ok: true, saved: false, reason: "missing-admin-db" });
  }

  const userAgent = cleanString(request.headers.get("user-agent"), 260);
  const country = countryFromHeaders(request.headers);
  await db.collection("growthEvents").add({
    event,
    sessionId,
    path,
    referrer: cleanPath(body.referrer),
    params: cleanParams(body.params),
    device: deviceFromUserAgent(userAgent),
    countryCode: country.countryCode,
    countryName: country.countryName,
    userAgent,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, saved: true });
}
