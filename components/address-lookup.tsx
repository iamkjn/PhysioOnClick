"use client";

import { useEffect, useRef, useState } from "react";

import { HOME_ADDRESS_MAX, normalisePostcode } from "@/lib/home-visit";

/**
 * Booking step 1, home visit: postcode -> "Select your address" dropdown via
 * /api/address/lookup + /api/address/resolve, with the plain Address input as
 * the fallback for every failure (no key, provider down, rate limited, network,
 * unknown postcode). The postcode and address are personal data: they only
 * ever travel in POST bodies to our own API, never in URLs, analytics or logs.
 *
 * Each resolve is a billable provider lookup, and keyboard users (arrow keys,
 * type-ahead) fire `change` once per option passed. So a change only records
 * the choice; the resolve is debounced and flushed on blur, so only the
 * settled choice is resolved, and the select never swaps out from under focus.
 */
type AddressLookupProps = {
  /** Normalised, already shape-checked AND covered by the caller. */
  postcode: string;
  /** Controlled value of the address line. */
  addressLine: string;
  onAddressLineChange: (value: string) => void;
  /** The provider's canonical postcode after a pick. */
  onPostcodeResolved?: (postcode: string) => void;
  /** id for the manual address input. */
  inputId?: string;
  /** Extra aria-describedby id(s) for the manual input (e.g. the coverage hint). */
  describedBy?: string;
};

type Suggestion = { id: string; label: string };
type View = "loading" | "select" | "manual";

const LOOKUP_DEBOUNCE_MS = 300;
const RESOLVE_DEBOUNCE_MS = 500;
const SELECT_ID = "book-home-address-select";
const LOADING_TEXT = "Finding addresses…";
const NOT_FOUND_HINT = "We couldn't find addresses for that postcode. Please type your address.";
const RESOLVE_FAILED_HINT = "We couldn't fetch that address. Please type it below.";

function foundText(count: number) {
  return `${count} address${count === 1 ? "" : "es"} found. Select your address.`;
}

function isSuggestionList(value: unknown): value is Suggestion[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) => s && typeof (s as Suggestion).id === "string" && typeof (s as Suggestion).label === "string",
    )
  );
}

async function postJson(url: string, body: unknown, signal?: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { res, data };
}

export function AddressLookup({
  postcode,
  addressLine,
  onAddressLineChange,
  onPostcodeResolved,
  inputId = "book-home-address",
  describedBy,
}: AddressLookupProps) {
  const [view, setView] = useState<View>("loading");
  const [addresses, setAddresses] = useState<Suggestion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  // The one persistent polite live region's text (loading, results, selection, fallback copy).
  const [status, setStatus] = useState(LOADING_TEXT);

  // Bumped by every lookup (and on cleanup) so a late lookup or resolve for an
  // old postcode is ignored.
  const lookupRef = useRef(0);
  // The canonical postcode we just reported after a pick: when the parent
  // echoes it back as a new `postcode`, keep the picked address instead of
  // looking the postcode up again.
  const resolvedPostcodeRef = useRef<string | null>(null);
  // True once the current line came from the list, so a postcode change clears it.
  const pickedRef = useRef(false);
  const firstLookupRef = useRef(true);

  const addressLineRef = useRef(addressLine);
  const onAddressLineChangeRef = useRef(onAddressLineChange);
  useEffect(() => {
    addressLineRef.current = addressLine;
    onAddressLineChangeRef.current = onAddressLineChange;
  }, [addressLine, onAddressLineChange]);

  // Pending resolve: the chosen id waits here until the debounce fires or the select blurs.
  const pendingIdRef = useRef<string | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveAbortRef = useRef<AbortController | null>(null);

  const selectRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Where focus goes after a view change (the focused control unmounts).
  const focusNextRef = useRef<"select" | "input" | null>(null);

  function cancelResolve() {
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    resolveTimerRef.current = null;
    pendingIdRef.current = null;
    resolveAbortRef.current?.abort();
    resolveAbortRef.current = null;
  }

  useEffect(() => {
    if (resolvedPostcodeRef.current !== null && resolvedPostcodeRef.current === postcode) {
      resolvedPostcodeRef.current = null;
      return;
    }
    resolvedPostcodeRef.current = null;

    // A list-picked address belongs to the old postcode: drop it.
    if (!firstLookupRef.current && pickedRef.current) onAddressLineChangeRef.current("");
    firstLookupRef.current = false;
    pickedRef.current = false;

    const request = ++lookupRef.current;
    const controller = new AbortController();
    setView("loading");
    setAddresses([]);
    setSelectedId("");
    setStatus(LOADING_TEXT);

    const timer = setTimeout(async () => {
      try {
        const { res, data } = await postJson("/api/address/lookup", { postcode }, controller.signal);
        if (request !== lookupRef.current) return;
        const list = data?.addresses;
        if (res.ok && isSuggestionList(list) && list.length > 0) {
          setAddresses(list);
          // Something already typed (e.g. back from step 2): keep it editable.
          if (addressLineRef.current) {
            setStatus("");
            setView("manual");
          } else {
            setStatus(foundText(list.length));
            setView("select");
          }
          return;
        }
        // 404 (or an empty list) gets an explanation; 429/503/anything else is a silent fallback.
        setStatus(res.status === 404 || (res.ok && isSuggestionList(list)) ? NOT_FOUND_HINT : "");
        setView("manual");
      } catch {
        if (request !== lookupRef.current) return;
        setStatus("");
        setView("manual");
      }
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      lookupRef.current++;
      clearTimeout(timer);
      controller.abort();
      cancelResolve();
    };
  }, [postcode]);

  useEffect(() => {
    const target = focusNextRef.current;
    if (!target) return;
    focusNextRef.current = null;
    (target === "select" ? selectRef.current : inputRef.current)?.focus();
  }, [view]);

  function goManual(nextStatus: string) {
    cancelResolve();
    focusNextRef.current = "input";
    setStatus(nextStatus);
    setView("manual");
  }

  function choose(id: string) {
    cancelResolve();
    setSelectedId(id);
    pickedRef.current = false;
    // Continue stays blocked until the choice is resolved.
    onAddressLineChange("");
    setStatus("");
    if (!id) return;
    pendingIdRef.current = id;
    resolveTimerRef.current = setTimeout(() => void flushResolve(), RESOLVE_DEBOUNCE_MS);
  }

  async function flushResolve() {
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    resolveTimerRef.current = null;
    const id = pendingIdRef.current;
    if (!id) return;
    pendingIdRef.current = null;
    resolveAbortRef.current?.abort();
    const controller = new AbortController();
    resolveAbortRef.current = controller;
    const lookup = lookupRef.current;
    const stale = () => controller.signal.aborted || lookup !== lookupRef.current;

    try {
      const { res, data } = await postJson("/api/address/resolve", { id }, controller.signal);
      if (stale()) return;
      resolveAbortRef.current = null;
      const raw = data?.addressLine;
      if (!res.ok || typeof raw !== "string" || !raw.trim()) {
        goManual(RESOLVE_FAILED_HINT);
        return;
      }
      const line = raw.slice(0, HOME_ADDRESS_MAX);
      pickedRef.current = true;
      onAddressLineChange(line);
      setStatus(`Selected: ${line}`);
      if (onPostcodeResolved && typeof data?.postcode === "string" && data.postcode.trim()) {
        const canonical = normalisePostcode(data.postcode);
        if (canonical !== postcode) resolvedPostcodeRef.current = canonical;
        onPostcodeResolved(canonical);
      }
    } catch {
      if (stale()) return;
      resolveAbortRef.current = null;
      goManual(RESOLVE_FAILED_HINT);
    }
  }

  const statusId = `${inputId}-status`;
  const inputDescribedBy = [describedBy, status ? statusId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="book-field book-field-full">
      {view === "select" ? (
        <>
          <label className="book-label" htmlFor={SELECT_ID}>
            Select your address
          </label>
          <select
            id={SELECT_ID}
            ref={selectRef}
            className="book-input"
            value={selectedId}
            onChange={(e) => choose(e.target.value)}
            onBlur={() => void flushResolve()}
          >
            <option value="">Choose your address</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </>
      ) : view === "manual" ? (
        <>
          <label className="book-label" htmlFor={inputId}>
            Address
          </label>
          <input
            id={inputId}
            ref={inputRef}
            className="book-input"
            type="text"
            autoComplete="street-address"
            required
            maxLength={HOME_ADDRESS_MAX}
            value={addressLine}
            onChange={(e) => {
              pickedRef.current = false;
              onAddressLineChange(e.target.value);
            }}
            aria-describedby={inputDescribedBy}
          />
        </>
      ) : null}
      <p id={statusId} className="book-field-hint" role="status" aria-live="polite">
        {status}
      </p>
      {view === "select" ? (
        <button
          type="button"
          className="book-edit"
          onClick={() => goManual("")}
        >
          Enter address manually
        </button>
      ) : view === "manual" && addresses.length > 0 ? (
        <button
          type="button"
          className="book-edit"
          onClick={() => {
            // The typed text is hidden by the list, so drop it: an un-picked
            // list must block Continue with the usual address error.
            pickedRef.current = false;
            onAddressLineChange("");
            setSelectedId("");
            setStatus(foundText(addresses.length));
            focusNextRef.current = "select";
            setView("select");
          }}
        >
          Choose from the list instead
        </button>
      ) : null}
    </div>
  );
}
