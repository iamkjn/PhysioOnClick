"use client";

import { useEffect } from "react";

import { trackLibraryEvent, type LibraryEvent } from "@/lib/analytics";
import { trackGrowthEvent, type GrowthEventName, type GrowthEventParams } from "@/lib/growth-tracking";

/**
 * Fires a library *_view analytics event once on mount. Renders nothing, so it
 * can be dropped into a server-rendered page body without affecting the DOM.
 */
export function TrackView({
  event,
  slug,
}: {
  event: LibraryEvent;
  slug: string;
}) {
  useEffect(() => {
    trackLibraryEvent(event, slug);
    trackGrowthEvent(event === "library_exercise_view" ? "library_view" : "service_view", {
      slug,
      source: event,
    });
  }, [event, slug]);

  return null;
}

export function TrackGrowthView({
  event,
  params,
}: {
  event: GrowthEventName;
  params?: GrowthEventParams;
}) {
  useEffect(() => {
    trackGrowthEvent(event, params);
  }, [event, params]);

  return null;
}
