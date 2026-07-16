"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { founder } from "@/lib/site-data";
import { allBookServices, bookServiceFor, type FocusArea } from "@/lib/cal-services";
import type { BookServiceId } from "@/lib/site-data";
import { BookingStepService } from "@/components/booking-step-service";
import { BookingStepTime } from "@/components/booking-step-time";
import { BookingStepDone } from "@/components/booking-step-done";

export type BookingConfirmation = {
  uid: string;
  start: string;
  serviceId: BookServiceId;
  name: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** "Thu 16 Jul 2026 · 10:00 · GMT (UK)" — the rail chip from the spec. */
export function formatSlotChip(iso: string) {
  const d = new Date(iso);
  // en-GB emits "Thu, 20 Aug 2026"; the spec's chip has no comma.
  const date = d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Europe/London"
    })
    .replace(",", "");
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London"
  });
  return `${date} · ${time} · GMT (UK)`;
}

export function BookingFlow() {
  const services = useMemo(() => allBookServices(), []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serviceId, setServiceId] = useState<BookServiceId>("initial-assessment");
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(["Back & neck"]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // undefined = auth still resolving, null = guest, User = signed in
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("service");
    const valid: BookServiceId[] = ["initial-assessment", "follow-up", "bundle-4", "bundle-8"];
    if (raw && (valid as string[]).includes(raw)) {
      setServiceId(raw as BookServiceId);
      setSelectedSlot(null);
    }
  }, []);

  const service = useMemo(() => bookServiceFor(serviceId), [serviceId]);

  // Slots are per-event-type, so a service change invalidates the chosen slot.
  const handleServiceChange = useCallback((next: BookServiceId) => {
    setServiceId(next);
    setSelectedSlot(null);
  }, []);

  const toggleFocusArea = useCallback((area: FocusArea) => {
    setFocusAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }, []);

  const handleConfirmed = useCallback((next: BookingConfirmation) => {
    setConfirmation(next);
    setStep(3);
  }, []);

  if (step === 3 && confirmation) {
    return <BookingStepDone confirmation={confirmation} />;
  }

  const railChecklist = step === 2 ? service.included.slice(0, 3) : service.included;

  return (
    <div className="book-flow">
      <aside className="book-rail">
        <div className="book-rail-brand">
          <span className="book-rail-mark" aria-hidden="true">
            P
          </span>
          <span className="book-rail-wordmark">PhysioOnClick</span>
        </div>

        <p className="book-rail-eyebrow">Your booking</p>
        <h2 className="book-rail-title">{service.title}</h2>
        <p className="book-rail-summary">{service.description}</p>

        <div className="book-rail-divider" />

        <p className="book-rail-eyebrow">What&rsquo;s included</p>
        <ul className="book-rail-list">
          {railChecklist.map((item) => (
            <li className="book-rail-list-item" key={item}>
              <span className="book-rail-check" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {selectedSlot ? (
          <>
            <p className="book-rail-slotchip" style={{ marginTop: 16 }}>
              {formatSlotChip(selectedSlot)}
            </p>
            <div className="book-rail-physio">
              <span className="book-rail-avatar" aria-hidden="true">
                {initials(founder.name)}
              </span>
              <span>
                <span className="book-rail-physio-name">{founder.name}</span>
                <br />
                <span className="book-rail-physio-cred">{founder.credentials[0]}</span>
              </span>
            </div>
          </>
        ) : null}

        <div className="book-rail-spacer" />
        <div className="book-rail-divider" />

        <div className="book-rail-total">
          <span className="book-rail-total-label">Total today</span>
          <span className="book-rail-total-price">£{service.price}</span>
        </div>
        <p className="book-rail-reassure">Free to reschedule up to 24 hours before your session.</p>
      </aside>

      {step === 1 ? (
        <BookingStepService
          services={services}
          serviceId={serviceId}
          focusAreas={focusAreas}
          onServiceChange={handleServiceChange}
          onToggleFocusArea={toggleFocusArea}
          onContinue={() => setStep(2)}
        />
      ) : (
        <BookingStepTime
          service={service}
          focusAreas={focusAreas}
          user={user}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onBack={() => setStep(1)}
          onConfirmed={handleConfirmed}
        />
      )}
    </div>
  );
}
