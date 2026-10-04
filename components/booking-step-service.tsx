"use client";

import { useRef, type KeyboardEvent, type RefObject } from "react";
import Link from "next/link";

import { serviceLabelFor, type CalService } from "@/lib/cal-services";
import type { BookServiceId, PricingItem } from "@/lib/site-data";
import { AddressLookup } from "@/components/address-lookup";
import {
  HOME_POSTCODE_MAX,
  HOME_VISIT_HINT,
  normalisePostcode,
  validateHomeVisit,
  type VisitType,
} from "@/lib/home-visit";
import { isCoveredPostcode, outOfAreaMessage, outwardCode } from "@/lib/home-visit-area";
import { formatPounds, sessionPricePence, travelFeePence } from "@/lib/home-visit-pricing";

type Props = {
  services: Array<CalService & PricingItem>;
  serviceId: BookServiceId;
  bookingContext?: {
    source: string;
    exercise: string;
    bodyPart: string;
  } | null;
  onServiceChange: (id: BookServiceId) => void;
  visitType: VisitType;
  homeAddressLine: string;
  homePostcode: string;
  /** Validation message for the home-visit fields, shown when Continue is blocked. */
  visitError?: string | null;
  onVisitTypeChange: (next: VisitType) => void;
  onHomeAddressLineChange: (value: string) => void;
  onHomePostcodeChange: (value: string) => void;
  /** "Book a video consultation instead" on the out-of-area message. */
  onSwitchToVideo: () => void;
  onContinue: () => void;
  titleRef?: RefObject<HTMLHeadingElement | null>;
};

/** Card order matches the owner's design: home first, then video. */
const VISIT_CARDS: Array<{ type: VisitType; title: string; subtitle: string }> = [
  { type: "home", title: "Home visit in Glasgow", subtitle: "Your physiotherapist visits you" },
  { type: "video", title: "Video consultation", subtitle: "Online, anywhere in the UK" },
];

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="6" width="13" height="12" rx="2" />
      <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
    </svg>
  );
}

/** Where a home visit stands, from the postcode alone. */
type Coverage = "pending" | "covered" | "uncovered";

function coverageFor(postcode: string): Coverage {
  // Shape check first, so pasted junk is never echoed into the out-of-area copy.
  if (!validateHomeVisit("placeholder", postcode).ok) return "pending";
  return isCoveredPostcode(postcode) ? "covered" : "uncovered";
}

/**
 * The out-of-area copy with "contact us" as a link to /contact. The message
 * string itself stays plain (outOfAreaMessage is shared with the server).
 */
function OutOfAreaText({ postcode }: { postcode: string }) {
  const message = outOfAreaMessage(postcode);
  const at = message.indexOf("contact us");
  if (at < 0) return <>{message}</>;
  return (
    <>
      {message.slice(0, at)}
      <Link href="/contact">contact us</Link>
      {message.slice(at + "contact us".length)}
    </>
  );
}

function readableSlug(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BookingStepService({
  services,
  serviceId,
  bookingContext,
  onServiceChange,
  visitType,
  homeAddressLine,
  homePostcode,
  visitError,
  onVisitTypeChange,
  onHomeAddressLineChange,
  onHomePostcodeChange,
  onSwitchToVideo,
  onContinue,
  titleRef
}: Props) {
  const cardRefs = useRef<Partial<Record<VisitType, HTMLButtonElement | null>>>({});
  // The postcode a list-picked address belongs to. Editing the postcode away
  // from it drops the address, so an old address can't pair with a new postcode
  // (the lookup itself unmounts while the postcode is mid-edit).
  const pickedForRef = useRef<string | null>(null);

  function handlePostcodeInput(value: string) {
    if (pickedForRef.current !== null && normalisePostcode(value) !== pickedForRef.current) {
      pickedForRef.current = null;
      onHomeAddressLineChange("");
    }
    onHomePostcodeChange(value);
  }
  const coverage: Coverage = visitType === "home" ? coverageFor(homePostcode) : "covered";
  const showBooking = visitType === "video" || coverage === "covered";

  // Radio-group keyboard pattern: arrows move the selection (and focus).
  function handleVisitKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const next = VISIT_CARDS[(index + step + VISIT_CARDS.length) % VISIT_CARDS.length]!.type;
    onVisitTypeChange(next);
    cardRefs.current[next]?.focus();
  }

  return (
    <section className="book-panel">
      <p
        className="book-panel-eyebrow"
        role="progressbar"
        aria-valuenow={1}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuetext="Step 1 of 3"
      >
        Step 1 of 3
      </p>
      <h1 className="book-panel-title" ref={titleRef} tabIndex={-1}>
        Book your appointment
      </h1>

      <div className="book-panel-body">
        {bookingContext ? (
          <div className="book-context-note" role="note">
            <strong>
              {bookingContext.source === "saved-exercise-plan"
                ? "Ready to turn your saved exercises into a safe plan?"
                : "We carried your exercise interest into booking."}
            </strong>
            <span>
              {bookingContext.exercise
                ? `${readableSlug(bookingContext.exercise)}${bookingContext.bodyPart ? ` · ${bookingContext.bodyPart}` : ""}`
                : "Your physiotherapist can review what you saved and build the right plan for your stage."}
            </span>
          </div>
        ) : null}

        <p className="book-focus-eyebrow" id="visit-type-label">
          How would you like to be seen?
        </p>
        <div className="book-visit-grid" role="radiogroup" aria-labelledby="visit-type-label">
          {VISIT_CARDS.map((card, index) => {
            const selected = visitType === card.type;
            return (
              <button
                type="button"
                key={card.type}
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                ref={(el) => {
                  cardRefs.current[card.type] = el;
                }}
                className={`book-visit-card${selected ? " is-selected" : ""}`}
                onClick={() => onVisitTypeChange(card.type)}
                onKeyDown={(e) => handleVisitKey(e, index)}
              >
                {card.type === "home" ? <HouseIcon /> : <CameraIcon />}
                <span>
                  <span className="book-visit-title">{card.title}</span>{" "}
                  <span className="book-visit-sub">{card.subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>

        {visitType === "home" ? (
          <div className="book-fields book-home-fields">
            {visitError && coverage !== "uncovered" ? (
              <p className="book-error book-field-full" role="alert">
                {visitError}
              </p>
            ) : null}
            <div className="book-field book-field-full">
              <label className="book-label" htmlFor="book-home-postcode">
                Postcode
              </label>
              <input
                id="book-home-postcode"
                className="book-input"
                type="text"
                autoComplete="postal-code"
                autoCapitalize="characters"
                required
                maxLength={HOME_POSTCODE_MAX}
                value={homePostcode}
                onChange={(e) => handlePostcodeInput(e.target.value)}
                aria-describedby="book-home-hint"
              />
              {coverage === "covered" ? (
                <p id="book-home-hint" className="book-field-hint" role="status">
                  We visit {outwardCode(homePostcode)}. {HOME_VISIT_HINT}
                </p>
              ) : coverage === "uncovered" ? (
                <div className="book-out-of-area" role="alert">
                  <span id="book-home-hint">
                    <OutOfAreaText postcode={homePostcode} />
                  </span>{" "}
                  <button
                    type="button"
                    className="book-out-of-area-switch"
                    onClick={() => {
                      onSwitchToVideo();
                      // The out-of-area box unmounts; land focus on the card now selected.
                      cardRefs.current.video?.focus();
                    }}
                  >
                    Book a video consultation instead
                  </button>
                </div>
              ) : (
                <p id="book-home-hint" className="book-field-hint">
                  Enter your postcode to check we visit your area.
                </p>
              )}
            </div>
            {coverage === "covered" ? (
              <AddressLookup
                postcode={normalisePostcode(homePostcode)}
                addressLine={homeAddressLine}
                onAddressLineChange={(value) => {
                  // Any change other than a resolved pick (typing, a new choice) ends the pairing.
                  if (!value) pickedForRef.current = null;
                  onHomeAddressLineChange(value);
                }}
                onPostcodeResolved={(canonical) => {
                  pickedForRef.current = canonical;
                  onHomePostcodeChange(canonical);
                }}
                describedBy="book-home-hint"
              />
            ) : null}
          </div>
        ) : null}

        {showBooking ? (
          <>
            <div className="book-service-grid" role="group" aria-label="Service">
              {services.map((s) => {
                const selected = s.id === serviceId;
                const travel = travelFeePence(s.id, visitType);
                return (
                  <button
                    type="button"
                    key={s.id}
                    aria-pressed={selected}
                    className={`book-service-card${selected ? " is-selected" : ""}`}
                    onClick={() => onServiceChange(s.id)}
                  >
                    {selected ? (
                      <span className="book-service-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                    <span className="book-service-name">{serviceLabelFor(s.id, visitType)}</span>
                    <span className="book-service-desc">{s.description}</span>
                    <span className="book-service-price">{formatPounds(sessionPricePence(s.id) + travel)}</span>{" "}
                    <span className="book-service-duration">{s.duration}</span>
                    {travel > 0 ? (
                      <span className="book-service-travel">incl. {formatPounds(travel)} travel</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      {showBooking ? (
        <div className="book-panel-footer">
          <button type="button" className="book-cta" onClick={onContinue}>
            Continue to times <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
