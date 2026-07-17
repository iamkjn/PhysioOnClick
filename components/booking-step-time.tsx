"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";
import type { Dependent } from "@/lib/dependents";
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
  titleRef?: RefObject<HTMLHeadingElement | null>;
  /** Dependents belonging to the signed-in user, for the "Booking for" picker. */
  dependents: Dependent[];
  /** Who the booking is for: `null` = the account holder ("self"), else a dependent id. */
  bookingForId: string | null;
  bookingForName: string;
  onBookingForChange: (id: string | null, name: string) => void;
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
      return "That email already has an account. Switch to “Sign in” to continue.";
    }
    if (error.code === "auth/weak-password") return "Please choose a password of at least 6 characters.";
    if (error.code === "auth/invalid-email") return "That email address doesn't look right.";
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      return "Your email or password is incorrect.";
    }
    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Please wait a moment and try again.";
    }
  }
  return "We couldn't complete that. Please check your details and try again.";
}

export function BookingStepTime({
  service,
  focusAreas,
  user,
  selectedSlot,
  onSelectSlot,
  onBack,
  onConfirmed,
  titleRef,
  dependents,
  bookingForId,
  bookingForName,
  onBookingForChange
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [slots, setSlots] = useState<SlotMap>({});
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Bumped by the "Try again" link on a fetch failure to re-run the effect
  // below without duplicating its fetch logic.
  const [retryToken, setRetryToken] = useState(0);

  // Roving keyboard focus for the calendar grid and the time-slot list: refs
  // let arrow keys jump between the *available* buttons (unavailable ones are
  // natively `disabled` and can't receive focus, so they're skipped).
  const dayButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const slotButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Guests default to creating an account; returning patients switch to "signin".
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [editingDetails, setEditingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const signedIn = Boolean(user);
  const signingIn = !signedIn && authMode === "signin";

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
  }, [service.id, viewMonth, today, retryToken]);

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

  /** Moves real focus to the next available (non-disabled) day in `step`'s
   *  direction, scanning past gaps. Arrow keys should skip unavailable days
   *  the same way Tab already does, not get stuck on them. */
  function focusAvailableDay(fromIndex: number, step: number) {
    let idx = fromIndex + step;
    while (idx >= 0 && idx < daysInMonth) {
      const key = dateKey(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), idx + 1));
      if ((slots[key]?.length ?? 0) > 0) {
        dayButtonRefs.current[idx]?.focus();
        return;
      }
      idx += step;
    }
  }

  function handleDayKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const stepByKey: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 7,
      ArrowUp: -7
    };
    const step = stepByKey[event.key];
    if (step === undefined) return;
    event.preventDefault();
    focusAvailableDay(index, step);
  }

  /** Same idea as focusAvailableDay, for the vertical time-slot list. */
  function focusAvailableSlot(fromIndex: number, step: number) {
    let idx = fromIndex + step;
    while (idx >= 0 && idx < slotRows.length) {
      if (slotRows[idx]?.iso) {
        slotButtonRefs.current[idx]?.focus();
        return;
      }
      idx += step;
    }
  }

  function handleSlotKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusAvailableSlot(index, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusAvailableSlot(index, -1);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedSlot) {
      setError("Please choose a time for your session.");
      return;
    }

    if (!consent) {
      setError("Please confirm your consent before booking.");
      return;
    }

    setSubmitting(true);
    try {
      // Resolve which account we book under. Signed-in users book as themselves;
      // guests either sign in to an existing account or create a new one first.
      let attendeeName: string;
      let attendeeEmail: string;

      if (signedIn) {
        attendeeName = user!.displayName ?? name.trim();
        attendeeEmail = user!.email ?? email.trim();
        if (!attendeeName || !attendeeEmail) {
          setError("Please enter your name and email.");
          return;
        }
      } else {
        if (!auth) {
          setError("Accounts aren't configured right now. Please contact us to book.");
          return;
        }
        const trimmedEmail = email.trim();

        if (authMode === "signin") {
          if (!trimmedEmail || !password) {
            setError("Please enter your email and password.");
            return;
          }
          try {
            const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
            await ensurePatientRecord(credential.user);
            attendeeName = credential.user.displayName ?? trimmedEmail;
            attendeeEmail = credential.user.email ?? trimmedEmail;
          } catch (authError) {
            setError(authErrorMessage(authError));
            return;
          }
        } else {
          const trimmedName = name.trim();
          if (!trimmedName || !trimmedEmail) {
            setError("Please enter your name and email.");
            return;
          }
          try {
            const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            await updateProfile(credential.user, { displayName: trimmedName });
            await ensurePatientRecord(credential.user, trimmedName);
            attendeeName = trimmedName;
            attendeeEmail = trimmedEmail;
          } catch (authError) {
            // Already registered? Drop them into sign-in instead of dead-ending.
            if (
              authError instanceof FirebaseError &&
              authError.code === "auth/email-already-in-use"
            ) {
              setAuthMode("signin");
              setPassword("");
              setError("You already have an account. Enter your password to sign in, then book.");
              return;
            }
            setError(authErrorMessage(authError));
            return;
          }
        }
      }

      // Mirrors mobile_app's WhoIsThisForScreen: for an already signed-in
      // user, record who this booking is for in pendingSelections/{uid}
      // before creating the Cal.com booking. app/api/cal-webhook/route.ts
      // reads this doc when the BOOKING_CREATED webhook fires and merges it
      // onto the new `bookings` record, then deletes it. Guests (who just
      // signed up/in above) are left out here — the webhook already
      // defaults an unmatched booking to "self", which is correct for them.
      if (signedIn && db) {
        const isSelf = !bookingForId || bookingForId === user!.uid;
        try {
          await setDoc(doc(db, "pendingSelections", user!.uid), {
            patientType: isSelf ? "self" : "dependent",
            patientId: isSelf ? user!.uid : bookingForId,
            patientName: isSelf ? attendeeName : bookingForName || "Patient",
            patientAvatarUrl: isSelf
              ? user!.photoURL ?? ""
              : dependents.find((d) => d.id === bookingForId)?.avatarUrl ?? "",
            selectedAt: serverTimestamp()
          });
        } catch {
          // Best-effort: never block the booking on this write failing.
          console.error("Could not record who this booking is for; it will default to self.");
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
        setError("That time was just taken. Please choose another.");
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
      <p
        className="book-panel-eyebrow"
        role="progressbar"
        aria-valuenow={2}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuetext="Step 2 of 3"
      >
        Step 2 of 3
      </p>
      <h1 className="book-panel-title" ref={titleRef} tabIndex={-1}>
        Time &amp; your details
      </h1>

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
                  onClick={() => {
                    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
                    setSelectedDate(null);
                    onSelectSlot(null);
                  }}
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
                  onClick={() => {
                    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
                    setSelectedDate(null);
                    onSelectSlot(null);
                  }}
                >
                  ›
                </button>
              </div>

              <div
                className="book-cal-grid"
                role="group"
                aria-label="Choose a date"
                aria-busy={loadingSlots}
              >
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
                      ref={(el) => {
                        dayButtonRefs.current[i] = el;
                      }}
                      disabled={!has}
                      aria-label={`${date.toLocaleDateString("en-GB", { dateStyle: "full" })}${has ? "" : ", no times available"}`}
                      aria-pressed={selected}
                      className={`book-cal-day${selected ? " is-selected" : ""}${has ? "" : " is-disabled"}`}
                      onClick={() => pickDay(key)}
                      onKeyDown={(event) => handleDayKeyDown(event, i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div role="status" aria-live="polite">
              {loadingSlots ? (
                <p className="book-loading">Loading times…</p>
              ) : slotsError ? (
                <div className="book-error">
                  <p>{slotsError}</p>
                  <button
                    type="button"
                    className="book-edit"
                    onClick={() => setRetryToken((t) => t + 1)}
                  >
                    Try again
                  </button>
                </div>
              ) : !selectedDate ? (
                <p className="book-empty">Pick a date to see available times.</p>
              ) : slotRows.length === 0 ? (
                <p className="book-empty">No times available on this day.</p>
              ) : (
                <div className="book-slots" role="listbox" aria-label="Choose a time">
                  {slotRows.map(({ time, iso }, i) => (
                    <button
                      type="button"
                      key={time}
                      ref={(el) => {
                        slotButtonRefs.current[i] = el;
                      }}
                      disabled={!iso}
                      role="option"
                      aria-selected={iso === selectedSlot}
                      aria-label={`${time}${iso ? "" : ", unavailable"}`}
                      className={`book-slot${iso && iso === selectedSlot ? " is-selected" : ""}${iso ? "" : " is-unavailable"}`}
                      onClick={() => iso && onSelectSlot(iso)}
                      onKeyDown={(event) => handleSlotKeyDown(event, i)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="book-divider" />

          {signedIn && dependents.length > 0 ? (
            <div className="book-field book-field-full" style={{ marginBottom: 16 }}>
              <label className="book-label" htmlFor="book-booking-for">
                Booking for
              </label>
              <select
                id="book-booking-for"
                className="book-input"
                value={bookingForId ?? user!.uid}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === user!.uid) {
                    onBookingForChange(null, user!.displayName ?? "");
                  } else {
                    const dep = dependents.find((d) => d.id === val);
                    onBookingForChange(val, dep?.name ?? "");
                  }
                }}
              >
                <option value={user!.uid}>{user!.displayName || "Myself"} (my appointment)</option>
                {dependents.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name} ({dep.relationship})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
              {!signingIn ? (
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
              ) : null}
              <div className={`book-field${signingIn ? " book-field-full" : ""}`}>
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
                    {signingIn ? "Password" : "Create a password"}
                  </label>
                  <input
                    id="book-password"
                    className="book-input"
                    type="password"
                    required
                    minLength={signingIn ? undefined : 6}
                    autoComplete={signingIn ? "current-password" : "new-password"}
                    placeholder={signingIn ? "Your password" : "At least 6 characters"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              ) : null}
              {!signedIn ? (
                <p className="book-field-full book-auth-toggle">
                  {signingIn ? "New patient?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    className="book-edit"
                    onClick={() => {
                      setAuthMode(signingIn ? "signup" : "signin");
                      setError(null);
                    }}
                  >
                    {signingIn ? "Create an account" : "Sign in"}
                  </button>
                </p>
              ) : null}
            </div>
          )}

          <label className="book-consent">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I consent to online consultation and the storage of my personal and clinical data as described in the{" "}
              <a href="/privacy-policy">Privacy Policy</a>, and I accept the{" "}
              <a href="/terms">Terms</a>.
            </span>
          </label>
        </div>

        <div className="book-panel-footer">
          <button type="button" className="book-back" onClick={onBack}>
            <span aria-hidden="true">←</span> Back
          </button>
          <button
            type="submit"
            className="book-cta"
            disabled={submitting || !selectedSlot || !consent}
            aria-label={
              !submitting && (!selectedSlot || !consent)
                ? `Confirm booking. Choose a time and confirm consent above first.`
                : undefined
            }
          >
            {submitting ? "Booking…" : `Confirm booking · £${service.price}`}
          </button>
        </div>
      </form>
    </section>
  );
}
