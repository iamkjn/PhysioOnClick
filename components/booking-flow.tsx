"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { track } from "@/lib/analytics";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { founder } from "@/lib/site-data";
import { allBookServices, bookServiceFor, includedFor, serviceLabelFor, type FocusArea } from "@/lib/cal-services";
import type { BookServiceId } from "@/lib/site-data";
import { getDependents, type Dependent } from "@/lib/dependents";
import { accountUserOrNull } from "@/lib/guest-booking";
import { DEFAULT_VISIT_TYPE, validateHomeVisit, type VisitType } from "@/lib/home-visit";
import { isCoveredPostcode, outOfAreaMessage } from "@/lib/home-visit-area";
import { formatPounds, sessionPricePence, travelFeeLabel, travelFeePence } from "@/lib/home-visit-pricing";
import { usePerson } from "@/components/person-provider";
import { BookingStepService } from "@/components/booking-step-service";
import { BookingStepTime } from "@/components/booking-step-time";
import { BookingStepDone } from "@/components/booking-step-done";

export type BookingConfirmation = {
  uid: string;
  start: string;
  serviceId: BookServiceId;
  name: string;
  /** Video unless set; a home visit has no video link to join. */
  visitType?: VisitType;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

type BookingContext = {
  source: string;
  exercise: string;
  bodyPart: string;
};

function focusAreaFromBodyPart(value: string): FocusArea | null {
  const body = value.toLowerCase();
  if (/(back|neck|spine|lumbar|thoracic|sciatic)/.test(body)) return "Back & neck";
  if (/(shoulder|arm|elbow|wrist|hand)/.test(body)) return "Shoulder";
  if (/(surgery|post.?op|operation|acl|replacement)/.test(body)) return "Post-surgery";
  if (/(sport|running|hamstring|groin|ankle|knee|hip|calf|tendon)/.test(body)) return "Sports injury";
  if (/(neuro|balance|gait|stroke|parkinson)/.test(body)) return "Neuro";
  if (/(child|paediatric|pediatric)/.test(body)) return "Paediatric";
  return null;
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
  // GMT in winter, BST in summer — derive it instead of hardcoding "GMT".
  const tzName =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      timeZoneName: "short"
    })
      .formatToParts(d)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  return `${date} · ${time} · ${tzName} (UK)`;
}

export function BookingFlow() {
  const services = useMemo(() => allBookServices(), []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serviceId, setServiceId] = useState<BookServiceId>("initial-assessment");
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(["Back & neck"]);
  // Video (UK-wide) or a home visit in a covered postcode district — same
  // calendar; a home visit adds a travel fee per visit (lib/home-visit-pricing).
  // The address is personal data: it stays in component state and the
  // checkout POST body only (never analytics, logs or the URL).
  const [visitType, setVisitType] = useState<VisitType>(DEFAULT_VISIT_TYPE);
  const [homeAddressLine, setHomeAddressLine] = useState("");
  const [homePostcode, setHomePostcode] = useState("");
  const [visitError, setVisitError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [bookingContext, setBookingContext] = useState<BookingContext | null>(null);

  // undefined = auth still resolving, null = guest, User = signed in
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Who the booking is for: null = the account holder ("self"), else a
  // dependent id. Seeded from the shared PersonProvider context (so booking
  // continues for whoever was active on /patient/recovery or the dashboard)
  // and threaded down so both the step-2 picker and the rail can reflect it.
  const personCtx = usePerson();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [bookingForId, setBookingForId] = useState<string | null>(null);
  const [bookingForName, setBookingForName] = useState("");

  const handleBookingForChange = useCallback((id: string | null, name: string) => {
    setBookingForId(id);
    setBookingForName(name);
  }, []);

  // Focus the new step panel's title on every step transition so keyboard/
  // screen-reader users aren't left on the (now-unmounted) triggering button.
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    panelTitleRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    // A guest-checkout (anonymous) session is not an account: treat it as
    // signed out so a returning guest sees the normal name/email form, not
    // "Booking as". booking-step-time reuses the session itself if it fits.
    return onAuthStateChanged(auth, (u) => setUser(accountUserOrNull(u)));
  }, []);

  // Only already-signed-in users get the "Booking for" picker (guests who
  // sign up/in mid-flow stay booking for themselves — see booking-step-time).
  // Seed the initial target from the shared person context once, falling
  // back to self if it points at a dependent that isn't (or is no longer)
  // one of this account's.
  useEffect(() => {
    if (!user) {
      setDependents([]);
      return;
    }
    let cancelled = false;
    getDependents(user.uid).then((deps) => {
      if (cancelled) return;
      setDependents(deps);
      const ctxId = personCtx?.personId;
      if (ctxId && ctxId !== user.uid && deps.some((d) => d.id === ctxId)) {
        setBookingForId(ctxId);
        setBookingForName(personCtx?.personName || deps.find((d) => d.id === ctxId)?.name || "");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per signed-in uid; personCtx is only read at that moment so later context changes elsewhere don't yank the target mid-flow
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("service");
    const params = new URLSearchParams(window.location.search);
    const valid: BookServiceId[] = ["initial-assessment", "follow-up", "bundle-4", "bundle-8"];
    if (raw && (valid as string[]).includes(raw)) {
      setServiceId(raw as BookServiceId);
      setSelectedSlot(null);
    }
    // ?visit=home preselects a home visit (linked from the home-visit copy).
    if (params.get("visit") === "home") setVisitType("home");
    const exercise = params.get("exercise")?.trim() ?? "";
    const bodyPart = params.get("body_part")?.trim() ?? "";
    const source = params.get("source")?.trim() ?? "";
    if (exercise || bodyPart || source === "saved-exercise-plan") {
      setBookingContext({ exercise, bodyPart, source });
      const mappedFocus = focusAreaFromBodyPart(bodyPart || exercise);
      if (mappedFocus) setFocusAreas([mappedFocus]);
      trackGrowthEvent("booking_focus_selected", {
        source: source || "exercise_context",
        focus_area: mappedFocus ?? bodyPart ?? exercise,
        exercise_slug: exercise || undefined,
        body_part: bodyPart || undefined,
      });
    }
  }, []);

  const service = useMemo(() => bookServiceFor(serviceId), [serviceId]);

  // Slots are per-event-type, so a service change invalidates the chosen slot.
  const handleServiceChange = useCallback((next: BookServiceId) => {
    trackGrowthEvent("booking_service_selected", { service_id: next });
    setServiceId(next);
    setSelectedSlot(null);
  }, []);

  const toggleFocusArea = useCallback((area: FocusArea) => {
    trackGrowthEvent("booking_focus_selected", { focus_area: area });
    setFocusAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }, []);

  // visit_type is recorded on step completion and checkout_started (never the address).
  // Home and video book different Cal.com events, so a real change of visit
  // type invalidates the chosen slot (re-clicking the selected card does not).
  const handleVisitTypeChange = useCallback(
    (next: VisitType) => {
      if (next !== visitType) setSelectedSlot(null);
      setVisitType(next);
      setVisitError(null);
    },
    [visitType]
  );

  // A new postcode makes any earlier home-visit error stale.
  const handleHomePostcodeChange = useCallback((value: string) => {
    setHomePostcode(value);
    setVisitError(null);
  }, []);

  const handleServiceContinue = useCallback(() => {
    if (visitType === "home") {
      const home = validateHomeVisit(homeAddressLine, homePostcode);
      if (!home.ok) {
        setVisitError(home.error);
        return;
      }
      if (!isCoveredPostcode(home.postcode)) {
        setVisitError(outOfAreaMessage(home.postcode));
        return;
      }
      setHomeAddressLine(home.addressLine);
      setHomePostcode(home.postcode);
    }
    setVisitError(null);
    trackGrowthEvent("booking_step_completed", {
      step: "service",
      service_id: serviceId,
      focus_areas: focusAreas.length,
      visit_type: visitType,
    });
    track("booking_step_service_done", { service_id: serviceId, focus_areas: focusAreas.length, visit_type: visitType });
    setStep(2);
  }, [visitType, homeAddressLine, homePostcode, serviceId, focusAreas.length]);

  const handleConfirmed = useCallback(
    (next: BookingConfirmation) => {
      trackGrowthEvent("booking_confirmed", { service_id: serviceId, for_dependent: Boolean(bookingForId) });
      track("booking_confirmed", { service_id: serviceId, for_dependent: Boolean(bookingForId) });
      setConfirmation(next);
      setStep(3);
    },
    [serviceId, bookingForId]
  );

  if (step === 3 && confirmation) {
    return (
      <>
        <p className="sr-only" role="status" aria-live="polite">
          Step 3 of 3: booking confirmed.
        </p>
        <BookingStepDone confirmation={confirmation} titleRef={panelTitleRef} />
      </>
    );
  }

  const included = includedFor(serviceId, visitType);
  // Travel only counts once the postcode is covered: until then (or for an
  // uncovered postcode) the rail shows the plain session price.
  const travel = visitType === "home" && isCoveredPostcode(homePostcode) ? travelFeePence(serviceId, visitType) : 0;
  const railChecklist = step === 2 ? included.slice(0, 3) : included;
  const stepAnnouncement =
    step === 1 ? "Step 1 of 3: book your appointment." : "Step 2 of 3: time and your details.";

  return (
    <div className="book-flow">
      <p className="sr-only" role="status" aria-live="polite">
        {stepAnnouncement}
      </p>
      <aside className="book-rail">
        <div className="book-rail-brand">
          <span className="book-rail-mark" aria-hidden="true">
            P
          </span>
          <span className="book-rail-wordmark">PhysioOnClick</span>
        </div>

        <p className="book-rail-eyebrow">Your booking</p>
        <h2 className="book-rail-title">{serviceLabelFor(serviceId, visitType)}</h2>
        <p className="book-rail-summary">{service.description}</p>

        {bookingForId ? (
          <p className="book-rail-slotchip" style={{ marginTop: 12 }}>
            Booking for {bookingForName || "someone else"}
          </p>
        ) : null}

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

        {travel > 0 ? (
          <div className="book-rail-travel">
            <span>{travelFeeLabel(serviceId)}</span>
            <span>{formatPounds(travel)}</span>
          </div>
        ) : null}
        <div className="book-rail-total">
          <span className="book-rail-total-label">Total</span>
          <span className="book-rail-total-price">{formatPounds(sessionPricePence(serviceId) + travel)}</span>
        </div>
        <p className="book-rail-reassure">Free to reschedule up to 24 hours before your session.</p>
        <Link href="/how-online-physiotherapy-works" className="book-rail-reassure" style={{ textDecoration: "underline" }}>
          What happens after I book?
        </Link>
      </aside>

      {step === 1 ? (
        <BookingStepService
          services={services}
          serviceId={serviceId}
          focusAreas={focusAreas}
          bookingContext={bookingContext}
          onServiceChange={handleServiceChange}
          onToggleFocusArea={toggleFocusArea}
          visitType={visitType}
          homeAddressLine={homeAddressLine}
          homePostcode={homePostcode}
          visitError={visitError}
          onVisitTypeChange={handleVisitTypeChange}
          onHomeAddressLineChange={setHomeAddressLine}
          onHomePostcodeChange={handleHomePostcodeChange}
          onSwitchToVideo={() => handleVisitTypeChange("video")}
          onContinue={handleServiceContinue}
          titleRef={panelTitleRef}
        />
      ) : (
        <BookingStepTime
          service={service}
          focusAreas={focusAreas}
          visit={
            visitType === "home"
              ? { visitType: "home", homeAddressLine, homePostcode }
              : { visitType: "video" }
          }
          user={user}
          selectedSlot={selectedSlot}
          onSelectSlot={(iso) => {
            setSelectedSlot(iso);
            if (iso) {
              trackGrowthEvent("booking_slot_selected", {
                service_id: service.id,
                slot_date: iso.slice(0, 10),
              });
            }
          }}
          onBack={() => setStep(1)}
          onConfirmed={handleConfirmed}
          titleRef={panelTitleRef}
          dependents={dependents}
          bookingForId={bookingForId}
          bookingForName={bookingForName}
          onBookingForChange={handleBookingForChange}
        />
      )}
    </div>
  );
}
