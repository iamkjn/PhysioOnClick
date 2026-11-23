"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { dayLabel, isDayKey, londonDayKey, shiftDayKey } from "@/lib/growth-day";

/** Today's UK date, re-checked every 30 seconds so an open page rolls over at midnight. */
export function useLondonToday() {
  const [today, setToday] = useState(() => londonDayKey());
  useEffect(() => {
    const id = window.setInterval(() => setToday(londonDayKey()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}

/**
 * The day the Growth tab is showing. Until another day is picked it follows
 * today, so the counts start again from 0 when the UK date changes.
 */
export function useGrowthDay(initialDay?: string) {
  const today = useLondonToday();
  const [picked, setPicked] = useState<string | null>(() =>
    isDayKey(initialDay) && initialDay < londonDayKey() ? initialDay : null,
  );
  const day = picked && picked < today ? picked : today;
  const setDay = useCallback(
    (next: string) => {
      if (!isDayKey(next)) return;
      setPicked(next < today ? next : null);
    },
    [today],
  );
  return { day, today, isToday: day === today, setDay };
}

export function AdminGrowthDayPicker({
  day,
  today,
  onChange,
}: {
  day: string;
  today: string;
  onChange: (day: string) => void;
}) {
  const isToday = day === today;
  return (
    <div className="admin-growth-day" role="group" aria-label="Day shown">
      <button type="button" aria-label="Previous day" onClick={() => onChange(shiftDayKey(day, -1))}>
        <ChevronLeft aria-hidden="true" />
      </button>
      <label>
        <span className="sr-only">Pick a day</span>
        <input type="date" value={day} max={today} onChange={(event) => onChange(event.target.value)} />
      </label>
      <button type="button" aria-label="Next day" disabled={isToday} onClick={() => onChange(shiftDayKey(day, 1))}>
        <ChevronRight aria-hidden="true" />
      </button>
      {isToday ? null : (
        <button type="button" className="admin-growth-day-today" onClick={() => onChange(today)}>
          Back to today
        </button>
      )}
      <span className="admin-growth-day-label" aria-live="polite">
        {dayLabel(day, today)}
      </span>
    </div>
  );
}

/** "today" / "yesterday" / "on Fri 20 Nov 2026", for sentences such as "Visitors today". */
export function dayPhrase(day: string, today: string) {
  const label = dayLabel(day, today);
  return label === "Today" || label === "Yesterday" ? label.toLowerCase() : `on ${label}`;
}
