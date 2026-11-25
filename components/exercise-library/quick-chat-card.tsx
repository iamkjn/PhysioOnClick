"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { WhatsAppIcon, recordContactTap } from "@/components/contact-options";
import { useVisitorRegion } from "@/components/region-switch";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { quickChatWhatsappHref } from "@/lib/practice-contact";
import { visitRequestHrefAbout } from "@/lib/visit-request";

const DELAY_MS = 10_000;
const WEEK_MS = 7 * 86_400_000;
const CLOSED_KEY = "poc-quick-chat-closed-at";
const SEEN_KEY = "poc-quick-chat-seen";
const SOURCE = "quick_chat_card";

function alreadyHandled() {
  try {
    if (window.sessionStorage.getItem(SEEN_KEY)) return true;
    return Date.now() - Number(window.localStorage.getItem(CLOSED_KEY) ?? 0) < WEEK_MS;
  } catch {
    return false;
  }
}

function remember(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // Storage blocked: the card may show again, which is harmless.
  }
}

/**
 * Small corner card on exercise pages offering a free 10-minute chat. UK
 * visitors only; appears after 10 seconds, or sooner once they scroll past the
 * steps. It never covers or dims the page, shows once per visit, and stays away
 * for a week once closed or used.
 */
export function QuickChatCard({ exerciseTitle }: { exerciseTitle: string }) {
  const region = useVisitorRegion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (region !== "uk" || alreadyHandled()) return;
    let retry: number | undefined;
    let done = false;
    const stop = () => {
      done = true;
      window.clearTimeout(timer);
      window.clearTimeout(retry);
      window.removeEventListener("scroll", onScroll);
    };
    const show = () => {
      if (done) return;
      window.clearTimeout(retry);
      // The cookie banner sits in the same corner: wait for that choice first.
      if (document.querySelector(".cookie-consent")) {
        retry = window.setTimeout(show, 1_000);
        return;
      }
      stop();
      setOpen(true);
      remember(() => window.sessionStorage, SEEN_KEY, "1");
      trackGrowthEvent("quick_chat_shown", { source: SOURCE });
    };
    const onScroll = () => {
      const steps = document.querySelector("[data-steps]");
      if (steps && steps.getBoundingClientRect().bottom < window.innerHeight * 0.5) show();
    };
    const timer = window.setTimeout(show, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    return stop;
  }, [region]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    remember(() => window.localStorage, CLOSED_KEY, String(Date.now()));
  };

  return (
    <aside className="quick-chat" aria-label="Free 10-minute chat">
      <button
        type="button"
        className="quick-chat-close"
        aria-label="Close"
        onClick={() => {
          trackGrowthEvent("quick_chat_closed", { source: SOURCE });
          close();
        }}
      >
        ×
      </button>
      <p className="quick-chat-title">Not sure this exercise is right for you?</p>
      <p className="quick-chat-text">Free 10-minute chat with a physiotherapist to see if physio can help.</p>
      <div className="quick-chat-actions">
        <a
          className="contact-bar-link contact-bar-link--whatsapp"
          href={quickChatWhatsappHref(exerciseTitle)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            recordContactTap("whatsapp", SOURCE, "condition");
            close();
          }}
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
        <Link
          className="contact-bar-link contact-bar-link--email"
          href={visitRequestHrefAbout(`Free 10-minute chat: ${exerciseTitle}`)}
          onClick={() => {
            trackGrowthEvent("book_now_click", { source: `${SOURCE}_callback` });
            close();
          }}
        >
          Call me back
        </Link>
      </div>
    </aside>
  );
}
