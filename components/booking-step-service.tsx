"use client";

import type { RefObject } from "react";

import { FOCUS_AREAS, type CalService, type FocusArea } from "@/lib/cal-services";
import type { BookServiceId, PricingItem } from "@/lib/site-data";
import {
  HOME_ADDRESS_MAX,
  HOME_POSTCODE_MAX,
  HOME_VISIT_HINT,
  VISIT_TYPE_LABELS,
  type VisitType,
} from "@/lib/home-visit";

type Props = {
  services: Array<CalService & PricingItem>;
  serviceId: BookServiceId;
  focusAreas: FocusArea[];
  bookingContext?: {
    source: string;
    exercise: string;
    bodyPart: string;
  } | null;
  onServiceChange: (id: BookServiceId) => void;
  onToggleFocusArea: (area: FocusArea) => void;
  visitType: VisitType;
  homeAddressLine: string;
  homePostcode: string;
  /** Validation message for the home-visit fields, shown when Continue is blocked. */
  visitError?: string | null;
  onVisitTypeChange: (next: VisitType) => void;
  onHomeAddressLineChange: (value: string) => void;
  onHomePostcodeChange: (value: string) => void;
  onContinue: () => void;
  titleRef?: RefObject<HTMLHeadingElement | null>;
};

function readableSlug(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function BookingStepService({
  services,
  serviceId,
  focusAreas,
  bookingContext,
  onServiceChange,
  onToggleFocusArea,
  visitType,
  homeAddressLine,
  homePostcode,
  visitError,
  onVisitTypeChange,
  onHomeAddressLineChange,
  onHomePostcodeChange,
  onContinue,
  titleRef
}: Props) {
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
        Choose your service
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

        <div className="book-service-grid" role="group" aria-label="Service">
          {services.map((s) => {
            const selected = s.id === serviceId;
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
                <span className="book-service-name">{s.title}</span>
                <span className="book-service-desc">{s.description}</span>
                <span className="book-service-price">£{s.price}</span>{" "}
                <span className="book-service-duration">{s.duration}</span>
              </button>
            );
          })}
        </div>

        <p className="book-focus-eyebrow" id="visit-type-label">
          How would you like to be seen?
        </p>
        <div className="book-chip-row" role="radiogroup" aria-labelledby="visit-type-label">
          {(Object.keys(VISIT_TYPE_LABELS) as VisitType[]).map((type) => {
            const selected = visitType === type;
            return (
              <label key={type} className={`book-chip${selected ? " is-selected" : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="radio"
                  name="visit-type"
                  value={type}
                  checked={selected}
                  onChange={() => onVisitTypeChange(type)}
                />
                {VISIT_TYPE_LABELS[type]}
              </label>
            );
          })}
        </div>

        {visitType === "home" ? (
          <div className="book-fields" style={{ marginTop: 12 }}>
            {visitError ? (
              <p className="book-error book-field-full" role="alert">
                {visitError}
              </p>
            ) : null}
            <div className="book-field book-field-full">
              <label className="book-label" htmlFor="book-home-address">
                Address
              </label>
              <input
                id="book-home-address"
                className="book-input"
                type="text"
                autoComplete="street-address"
                required
                maxLength={HOME_ADDRESS_MAX}
                value={homeAddressLine}
                onChange={(e) => onHomeAddressLineChange(e.target.value)}
                aria-describedby="book-home-hint"
              />
            </div>
            <div className="book-field">
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
                onChange={(e) => onHomePostcodeChange(e.target.value)}
                aria-describedby="book-home-hint"
              />
            </div>
            <p id="book-home-hint" className="book-field-hint book-field-full">
              {HOME_VISIT_HINT}
            </p>
          </div>
        ) : null}

        <p className="book-focus-eyebrow" id="focus-label">
          Focus area (optional)
        </p>
        <div className="book-chip-row" role="group" aria-labelledby="focus-label">
          {FOCUS_AREAS.map((area) => {
            const selected = focusAreas.includes(area);
            return (
              <button
                type="button"
                key={area}
                aria-pressed={selected}
                className={`book-chip${selected ? " is-selected" : ""}`}
                onClick={() => onToggleFocusArea(area)}
              >
                {area}
              </button>
            );
          })}
        </div>
      </div>

      <div className="book-panel-footer">
        <button type="button" className="book-cta" onClick={onContinue}>
          Continue to times <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
