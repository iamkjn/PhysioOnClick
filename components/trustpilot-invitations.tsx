"use client";

import { useEffect } from "react";
import { getAuth } from "firebase/auth";

interface InvitableBooking {
  id: string;
  patientName: string;
  sessionDate: Date;
}

interface Props {
  bookings: InvitableBooking[];
}

const DAY = 24 * 60 * 60 * 1000;
const MIN_AGE = DAY; // don't ask before 24h
const MAX_AGE = 60 * DAY; // don't ask about ancient sessions

declare global {
  interface Window {
    tp?: (action: string, payload?: Record<string, unknown>) => void;
  }
}

function alreadyInvited(id: string): boolean {
  try {
    return localStorage.getItem(`tp_inv_${id}`) === "1";
  } catch {
    return false;
  }
}
function markInvited(id: string) {
  try {
    localStorage.setItem(`tp_inv_${id}`, "1");
  } catch {
    /* private mode — worst case the server BCC flow still sends one */
  }
}

/**
 * Fires a Trustpilot review invitation (via the Invitations JS loaded in the
 * layout) for each completed session that's 24h–60d old and not yet invited
 * from this browser. Trustpilot dedupes by `referenceId` (the booking id), so
 * this is safe alongside the server-side BCC email — whichever reaches
 * Trustpilot first wins and the other is ignored.
 */
export function TrustpilotInvitations({ bookings }: Props) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY) return;
    const user = getAuth().currentUser;
    const email = user?.email;
    if (!email) return;

    const now = Date.now();
    const due = bookings.filter((b) => {
      const age = now - b.sessionDate.getTime();
      return age > MIN_AGE && age < MAX_AGE && !alreadyInvited(b.id);
    });
    if (due.length === 0) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (typeof window.tp === "function") {
        for (const b of due) {
          window.tp("createInvitation", {
            recipientEmail: email,
            recipientName: user?.displayName || b.patientName || "",
            referenceId: b.id,
            source: "InvitationScript",
          });
          markInvited(b.id);
        }
        window.clearInterval(timer);
      } else if (tries > 20) {
        window.clearInterval(timer); // ~10s; give up quietly, BCC covers it
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [bookings]);

  return null;
}
