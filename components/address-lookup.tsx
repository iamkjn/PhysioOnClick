"use client";

import { useEffect, useRef, useState } from "react";

import { HOME_ADDRESS_MAX, normalisePostcode } from "@/lib/home-visit";

/**
 * Booking step 1, home visit: postcode -> "Select your address" dropdown via
 * /api/address/lookup + /api/address/resolve, with the plain Address input as
 * the fallback for every failure (no key, provider down, rate limited, network,
 * unknown postcode). The postcode and address are personal data: they only
 * ever travel in POST bodies to our own API, never in URLs, analytics or logs.
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
};

type Suggestion = { id: string; label: string };
type View = "loading" | "select" | "chosen" | "manual";

const DEBOUNCE_MS = 300;
const SELECT_ID = "book-home-address-select";
const NOT_FOUND_HINT = "We couldn't find addresses for that postcode. Please type your address.";
const RESOLVE_FAILED_HINT = "We couldn't fetch that address. Please type it below.";

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
}: AddressLookupProps) {
  const [view, setView] = useState<View>("loading");
  const [addresses, setAddresses] = useState<Suggestion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // Bumped by every lookup/pick (and on cleanup) so a late response for an
  // old postcode or an earlier pick is ignored.
  const requestRef = useRef(0);
  // The canonical postcode we just reported after a pick: when the parent
  // echoes it back as a new `postcode`, keep the chosen address instead of
  // looking the postcode up again.
  const resolvedPostcodeRef = useRef<string | null>(null);
  const addressLineRef = useRef(addressLine);
  useEffect(() => {
    addressLineRef.current = addressLine;
  }, [addressLine]);

  const selectRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  // Where focus goes after a user-initiated view change (the focused control unmounts).
  const focusNextRef = useRef<"select" | "input" | "change" | null>(null);

  useEffect(() => {
    if (resolvedPostcodeRef.current !== null && resolvedPostcodeRef.current === postcode) {
      resolvedPostcodeRef.current = null;
      return;
    }
    resolvedPostcodeRef.current = null;

    const request = ++requestRef.current;
    const controller = new AbortController();
    setView("loading");
    setAddresses([]);
    setSelectedId("");
    setHint(null);
    setResolving(false);

    const timer = setTimeout(async () => {
      try {
        const { res, data } = await postJson("/api/address/lookup", { postcode }, controller.signal);
        if (request !== requestRef.current) return;
        const list = data?.addresses;
        if (res.ok && isSuggestionList(list) && list.length > 0) {
          setAddresses(list);
          // Something already typed (e.g. back from step 2): keep it editable.
          setView(addressLineRef.current ? "manual" : "select");
          return;
        }
        // 404 (or an empty list) gets an explanation; 429/503/anything else is a silent fallback.
        setHint(res.status === 404 || (res.ok && isSuggestionList(list)) ? NOT_FOUND_HINT : null);
        setView("manual");
      } catch {
        if (request !== requestRef.current) return;
        setView("manual");
      }
    }, DEBOUNCE_MS);

    return () => {
      requestRef.current++;
      clearTimeout(timer);
      controller.abort();
    };
  }, [postcode]);

  useEffect(() => {
    const target = focusNextRef.current;
    if (!target) return;
    focusNextRef.current = null;
    const el = target === "select" ? selectRef.current : target === "input" ? inputRef.current : changeRef.current;
    el?.focus();
  }, [view]);

  function goManual(nextHint: string | null) {
    focusNextRef.current = "input";
    setHint(nextHint);
    setView("manual");
  }

  async function pick(id: string) {
    setSelectedId(id);
    if (!id) {
      onAddressLineChange("");
      return;
    }
    const request = ++requestRef.current;
    setResolving(true);
    try {
      const { res, data } = await postJson("/api/address/resolve", { id });
      if (request !== requestRef.current) return;
      setResolving(false);
      const line = data?.addressLine;
      if (!res.ok || typeof line !== "string" || !line.trim()) {
        goManual(RESOLVE_FAILED_HINT);
        return;
      }
      onAddressLineChange(line.slice(0, HOME_ADDRESS_MAX));
      if (typeof data?.postcode === "string" && data.postcode.trim()) {
        const canonical = normalisePostcode(data.postcode);
        if (onPostcodeResolved) {
          if (canonical !== postcode) resolvedPostcodeRef.current = canonical;
          onPostcodeResolved(canonical);
        }
      }
      focusNextRef.current = "change";
      setHint(null);
      setView("chosen");
    } catch {
      if (request !== requestRef.current) return;
      setResolving(false);
      goManual(RESOLVE_FAILED_HINT);
    }
  }

  if (view === "loading") {
    return (
      <div className="book-field book-field-full">
        <p className="book-field-hint" role="status">
          Finding addresses…
        </p>
      </div>
    );
  }

  if (view === "chosen") {
    return (
      <div className="book-field book-field-full">
        <span className="book-label">Your address</span>
        <div className="book-signed-in">
          <p>{addressLine}</p>
          <button
            type="button"
            className="book-edit"
            ref={changeRef}
            onClick={() => {
              focusNextRef.current = "select";
              setView("select");
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  if (view === "select") {
    return (
      <div className="book-field book-field-full">
        <label className="book-label" htmlFor={SELECT_ID}>
          Select your address
        </label>
        <select
          id={SELECT_ID}
          ref={selectRef}
          className="book-input"
          value={selectedId}
          disabled={resolving}
          aria-busy={resolving || undefined}
          onChange={(e) => void pick(e.target.value)}
        >
          <option value="">Choose your address</option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <button type="button" className="book-edit" onClick={() => goManual(null)}>
          Enter address manually
        </button>
      </div>
    );
  }

  const hintId = `${inputId}-hint`;
  return (
    <div className="book-field book-field-full">
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
        onChange={(e) => onAddressLineChange(e.target.value)}
        aria-describedby={hint ? hintId : undefined}
      />
      {hint ? (
        <p id={hintId} className="book-field-hint">
          {hint}
        </p>
      ) : null}
      {addresses.length > 0 ? (
        <button
          type="button"
          className="book-edit"
          onClick={() => {
            // The typed text is hidden by the list, so drop it: an un-picked
            // list must block Continue with the usual address error.
            onAddressLineChange("");
            setSelectedId("");
            setHint(null);
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
