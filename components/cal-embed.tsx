"use client";

import Script from "next/script";

declare global {
  interface Window {
    Cal?: (...args: unknown[]) => void;
  }
}

export function CalEmbed() {
  function onLoad() {
    window.Cal?.("init", { origin: "https://cal.com" });
    window.Cal?.("inline", {
      elementOrSelector: "#cal-embed",
      calLink: process.env.NEXT_PUBLIC_CAL_USERNAME,
    });
  }

  return (
    <>
      <Script
        src="https://app.cal.com/embed/embed.js"
        strategy="lazyOnload"
        onLoad={onLoad}
      />
      <div id="cal-embed" style={{ minHeight: "700px", width: "100%" }} />
    </>
  );
}
