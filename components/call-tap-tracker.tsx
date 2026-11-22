"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";
import { trackGrowthEvent } from "@/lib/growth-tracking";

/** Where a phone link sits: the nearest `data-contact-source`, else the footer or just the page. */
function callTapSource(link: Element): string {
  const tagged = link.closest("[data-contact-source]")?.getAttribute("data-contact-source");
  if (tagged) return tagged;
  if (link.closest("footer")) return "footer";
  return "page";
}

/**
 * Logs every tap on a phone number (`tel:` link) anywhere on the site, as
 * `call_click`. One listener on the document covers every number on every
 * page, including ones added later, so no link needs its own handler. Only
 * where the number sat is recorded, never the visitor's own number.
 */
export function CallTapTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href^="tel:"]');
      if (!link) return;
      const source = callTapSource(link);
      trackGrowthEvent("call_click", { source });
      track("contact_click", { method: "call", source });
    }
    // Capture phase, so a handler that stops propagation can't hide the tap.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
