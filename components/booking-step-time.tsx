"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, updateProfile, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { auth } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";
import type { CalService, FocusArea } from "@/lib/cal-services";
import type { PricingItem } from "@/lib/site-data";
import type { BookingConfirmation } from "@/components/booking-flow";

type Props = {
  service: CalService & PricingItem;
  focusAreas: FocusArea[];
  user: User | null | undefined;
  selectedSlot: string | null;
  onSelectSlot: (iso: string | null) => void;
  onBack: () => void;
  onConfirmed: (c: BookingConfirmation) => void;
};

type SlotMap = Record<string, string[]>;

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local YYYY-MM-DD without pulling in a date library. */
function dateKey(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function londonTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London"
  });
}

/** Monday-first offset for the 7-column grid. */
function leadingBlanks(firstOfMonth: Date) {
  return (firstOfMonth.getDay() + 6) % 7;
}

function authErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "That email already has an account. Please sign in first, then book.";
    }
    if (error.code === "auth/weak-password") return "Please choose a password of at least 6 characters.";
    if (error.code === "auth/invalid-email") return "That email address doesn't look right.";
  }
  return "We couldn't create your account. Please check your details and try again.";
}

export function BookingStepTime({
  service,
  focusAreas,
  user,
  selectedSlot,
  onSelectSlot,
  onBack,
  onConfirmed
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [slots, setSlots] = useState<SlotMap>({});
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = Boolean(user);

  useEffect(() => {
    let cancelled = false;
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const start = first < today ? today : first;

    setLoadingSlots(true);
    setSlotsError(null);

    const params = new URLSearchParams({
      service: service.id,
      start: dateKey(start),
      end: dateKey(last)
    });

    fetch(`/api/cal/slots?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { slots: SlotMap }) => {
        if (cancelled) return;
        setSlots(data.slots ?? {});
      })
      .catch(() => {
        if (!cancelled) setSlotsError("We couldn't load available times. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service.id, viewMonth, today]);

  // The API returns only free times. Deriving the physio's usual hours from the
  // whole month lets us show genuinely-busy times struck through, rather than
  // inventing a schedule the clinic never offered.
  const typicalTimes = useMemo(() => {
    const set = new Set<string>();
    for (const list of Object.values(slots)) for (const iso of list) set.add(londonTime(iso));
    const times = [...set].sort();
    return times.length > 24 ? [] : times;
  }, [slots]);

  const daySlots = selectedDate ? (slots[selectedDate] ?? []) : [];
  const availableByTime = useMemo(
    () => new Map(daySlots.map((iso) => [londonTime(iso), iso])),
    [daySlots]
  );

  const slotRows = useMemo(() => {
    if (typicalTimes.length === 0) {
      return daySlots.map((iso) => ({ time: londonTime(iso), iso }));
    }
    return typicalTimes.map((time) => ({ time, iso: availableByTime.get(time) ?? null }));
  }, [typicalTimes, daySlots, availableByTime]);

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const canGoBack = firstOfMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  function pickDay(key: string) {
    setSelectedDate(key);
    onSelectSlot(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("Please choose a time for your session.");
      return;
    }

    const attendeeName = signedIn ? (user!.displayName ?? name.trim()) : name.trim();
    const attendeeEmail = signedIn ? (user!.email ?? email.trim()) : email.trim();

    if (!attendeeName || !attendeeEmail) {
      setError("Please enter your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      // Guest: create the account first. If the booking then fails, the retry
      // lands on the signed-in branch instead of a duplicate-email dead end.
      if (!signedIn) {
        if (!auth) {
          setError("Accounts aren't configured right now. Please contact us to book.");
          return;
        }
        try {
          const credential = await createUserWithEmailAndPassword(auth, attendeeEmail, password);
          await updateProfile(credential.user, { displayName: attendeeName });
          await ensurePatientRecord(credential.user, attendeeName);
        } catch (authError) {
          setError(authErrorMessage(authError));
          return;
        }
      }

      const res = await fetch("/api/cal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.id,
          start: selectedSlot,
          name: attendeeName,
          email: attendeeEmail,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          focusAreas
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("That time couldn't be booked — it may have just been taken. Please pick another.");
        return;
      }
      onConfirmed({
        uid: data.uid,
        start: selectedSlot,
        serviceId: service.id,
        name: attendeeName
      });
    } catch {
      setError("Something went wrong booking your session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="book-panel">
      <p className="book-panel-eyebrow">Step 2 of 3</p>
      <h1 className="book-panel-title">Time &amp; your details</h1>

      <form onSubmit={handleSubmit} style={{ display: "contents" }}>
        <div className="book-panel-body">
          {error ? (
            <p className="book-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="book-time-grid">
            <div>
              <div className="book-cal-head">
                <button
                  type="button"
                  className="book-cal-nav"
                  aria-label="Previous month"
                  disabled={!canGoBack}
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                >
                  ‹
                </button>
                <span className="book-cal-month">
                  {viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  className="book-cal-nav"
                  aria-label="Next month"
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                >
                  ›
                </button>
              </div>

              <div className="book-cal-grid" role="group" aria-label="Choose a date">
                {DOW.map((d) => (
                  <span className="book-cal-dow" key={d}>
                    {d}
                  </span>
                ))}
                {Array.from({ length: leadingBlanks(firstOfMonth) }).map((_, i) => (
                  <span className="book-cal-day is-empty" key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1);
                  const key = dateKey(date);
                  const has = (slots[key]?.length ?? 0) > 0;
                  const selected = key === selectedDate;
                  return (
                    <button
                      type="button"
                      key={key}
                      disabled={!has}
                      aria-label={date.toLocaleDateString("en-GB", { dateStyle: "full" })}
                      aria-pressed={selected}
                      className={`book-cal-day${selected ? " is-selected" : ""}${has ? "" : " is-disabled"}`}
                      onClick={() => pickDay(key)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {loadingSlots ? (
                <p className="book-loading">Loading times…</p>
              ) : slotsError ? (
                <p className="book-error">{slotsError}</p>
              ) : !selectedDate ? (
                <p className="book-empty">Pick a date to see available times.</p>
              ) : slotRows.length === 0 ? (
                <p className="book-empty">No times available on this day.</p>
              ) : (
                <div className="book-slots" role="group" aria-label="Choose a time">
                  {slotRows.map(({ time, iso }) => (
                    <button
                      type="button"
                      key={time}
                      disabled={!iso}
                      aria-pressed={iso === selectedSlot}
                      className={`book-slot${iso && iso === selectedSlot ? " is-selected" : ""}${iso ? "" : " is-unavailable"}`}
                      onClick={() => iso && onSelectSlot(iso)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="book-divider" />

          {signedIn && !editingDetails ? (
            <div className="book-signed-in">
              <span>
                Booking as <strong>{user!.displayName || user!.email}</strong>
                {user!.displayName ? ` · ${user!.email}` : ""}
              </span>
              <button
                type="button"
                className="book-edit"
                onClick={() => {
                  setName(user!.displayName ?? "");
                  setEmail(user!.email ?? "");
                  setEditingDetails(true);
                }}
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="book-fields">
              <div className="book-field">
                <label className="book-label" htmlFor="book-name">
                  Full name
                </label>
                <input
                  id="book-name"
                  className="book-input"
                  required
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="book-field">
                <label className="book-label" htmlFor="book-email">
                  Email
                </label>
                <input
                  id="book-email"
                  className="book-input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {!signedIn ? (
                <div className="book-field book-field-full">
                  <label className="book-label" htmlFor="book-password">
                    Create a password
                  </label>
                  <input
                    id="book-password"
                    className="book-input"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="book-panel-footer">
          <button type="button" className="book-back" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="book-cta" disabled={submitting || !selectedSlot}>
            {submitting ? "Booking…" : `Confirm booking · £${service.price}`}
          </button>
        </div>
      </form>
    </section>
  );
}
