"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    // Stop the browser from auto-restoring the previous scroll position on a
    // hard refresh. The signed-in home + sub-pages grow tall *after* mount
    // (auth resolves → dashboard + charts render), and 'auto' restoration then
    // jumps to the old offset once the page is tall enough — reading as an
    // unwanted scroll-down on refresh, defeating the top-scroll below. We always
    // start at the top, so 'manual' is consistent; back/forward still reset to
    // top via the pathname effect.
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
