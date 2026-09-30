"use client";

import type { RefObject } from "react";

import { FOCUS_AREAS, type CalService, type FocusArea } from "@/lib/cal-services";
import type { BookServiceId, PricingItem } from "@/lib/site-data";

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
