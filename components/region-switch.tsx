"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { browserRegion, type VisitorRegion } from "@/lib/visitor-region";

const subscribe = () => () => {};

/** The visitor's region: "unknown" on the server and during hydration, then the browser's answer. */
export function useVisitorRegion(): VisitorRegion {
  return useSyncExternalStore(subscribe, browserRegion, () => "unknown");
}

/**
 * Renders `uk` for UK visitors, `overseas` for everyone else, and `fallback`
 * on the server and until the browser has answered. Leave `uk` or `overseas`
 * out to keep the fallback for that region; pass null to show nothing.
 */
export function RegionSwitch({
  fallback,
  uk,
  overseas,
}: {
  fallback: ReactNode;
  uk?: ReactNode;
  overseas?: ReactNode;
}) {
  const region = useVisitorRegion();
  if (region === "uk" && uk !== undefined) return <>{uk}</>;
  if (region === "overseas" && overseas !== undefined) return <>{overseas}</>;
  return <>{fallback}</>;
}
