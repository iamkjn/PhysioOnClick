// components/person-switcher.tsx
"use client";

import { useEffect, useState } from "react";
import { getDependents, type Dependent } from "@/lib/dependents";
import { formatPersonName } from "@/lib/name-format";
import { Skeleton } from "@/components/skeleton";
import { usePerson } from "@/components/person-provider";
import type { CaredForPatient } from "@/lib/carer-access";
import { carerOptionValue, parseCarerOptionValue, resolvePatientTarget } from "@/lib/patient-target";

const ADD_PERSON_VALUE = "__add_person__";

interface Props {
  uid: string;
  displayName: string;
  onSelect: (personId: string, name: string) => void;
  label?: string;
  alwaysShow?: boolean;
  onAddPerson?: () => void;
  // Admin use: preselect a specific dependent on mount (from a `?person=` deep
  // link in the patients list) when there's no PersonProvider context.
  initialPersonId?: string;
  /**
   * Carer access (lib/carer-access.ts): patients the signed-in user cares
   * for, from useCaredForPatients(). `undefined` = this page doesn't offer
   * carer mode (booking, appointments, admin); `null` = still loading.
   * Only recovery pages (home, recovery, exercises) pass it.
   */
  caredFor?: CaredForPatient[] | null;
}

function carerLabel(p: CaredForPatient): string {
  const name = formatPersonName(p.name, "Patient");
  return p.relationship ? `${name} (${p.relationship})` : name;
}

export function PersonSwitcher({
  uid,
  displayName,
  onSelect,
  label = "Booking session for:",
  alwaysShow = false,
  onAddPerson,
  initialPersonId,
  caredFor,
}: Props) {
  // Optional: undefined when no PersonProvider is mounted (e.g. admin pages,
  // or this component rendered in isolation) — every use below is guarded.
  const personCtx = usePerson();
  const carerEnabled = caredFor !== undefined && !!personCtx;
  const displayLabel = formatPersonName(displayName, "Patient");
  const [dependents, setDependents] = useState<Dependent[] | null>(null);

  // The <select> value for whatever the shared context currently points at.
  function contextValue(): string {
    if (!personCtx) return uid;
    const target = resolvePatientTarget(uid, {
      personId: personCtx.personId,
      careForUid: carerEnabled ? personCtx.careForUid : null,
      careForViewerUid: personCtx.careForViewerUid,
    });
    if (target.mode === "carer") return carerOptionValue(target.ownerUid);
    return target.personId;
  }

  const [selected, setSelected] = useState(() => {
    if (personCtx) return contextValue();
    if (initialPersonId && initialPersonId !== uid) return initialPersonId;
    return uid;
  });
  const [isFocused, setIsFocused] = useState(false);

  function nameFor(value: string): string {
    if (value === uid) return displayLabel;
    const carerUid = parseCarerOptionValue(value);
    if (carerUid) return formatPersonName(caredFor?.find((p) => p.uid === carerUid)?.name ?? personCtx?.careForName, "Patient");
    return formatPersonName(dependents?.find((d) => d.id === value)?.name, "");
  }

  useEffect(() => {
    setDependents(null);
    getDependents(uid).then((deps) => {
      setDependents(deps);
      // Reconcile guard: if the shared context points at a person who no
      // longer exists for this uid (removed dependent, or a different
      // account signed in), fall back to self. Runs once dependents load.
      personCtx?.reconcile(uid, deps.map((d) => d.id));
      // No-context (admin) deep link: resolve the preselected dependent's
      // name and push it up so the detail view switches to them.
      if (!personCtx) {
        const targetId = initialPersonId && initialPersonId !== uid ? initialPersonId : selected;
        if (targetId === uid) {
          onSelect(uid, displayLabel);
          return;
        }
        const dep = deps.find((d) => d.id === targetId);
        if (dep) onSelect(dep.id, formatPersonName(dep.name));
        else { setSelected(uid); onSelect(uid, displayLabel); }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- personCtx.reconcile has a stable identity (useCallback); only re-run when uid changes
  }, [uid]);

  // Carer reconcile guard: once the cared-for list loads, leave carer mode if
  // the stored patient is no longer one this account cares for. Also re-runs
  // when the stored selection hydrates (the provider reads localStorage in an
  // effect that can land after this one).
  const storedCareForUid = personCtx?.careForUid ?? null;
  useEffect(() => {
    if (!carerEnabled || !Array.isArray(caredFor) || !storedCareForUid) return;
    personCtx?.reconcileCareFor(uid, caredFor.map((p) => p.uid));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconcileCareFor is stable (useCallback)
  }, [caredFor, uid, carerEnabled, storedCareForUid]);

  // Admin deep link: `initialPersonId` is read in an effect on the page, so it
  // arrives a tick after mount — after the useState initializer above has
  // already run with `undefined`. Sync to it when it lands.
  useEffect(() => {
    if (!initialPersonId || initialPersonId === uid) return;
    if (initialPersonId === selected && dependents === null) return;
    setSelected(initialPersonId);
    const dep = dependents?.find((d) => d.id === initialPersonId);
    onSelect(initialPersonId, formatPersonName(dep?.name, ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onSelect` is caller-created; this effect intentionally follows only deep-link/dependency resolution.
  }, [initialPersonId, dependents, selected, uid]);

  // Keep local selection (and the caller, via onSelect) in sync with the
  // shared context — e.g. another switcher instance on the same page
  // changed it, or a reconcile guard above just reset it to self.
  useEffect(() => {
    if (!personCtx) return;
    const nextValue = contextValue();
    if (nextValue === selected) return;
    setSelected(nextValue);
    const carerUid = parseCarerOptionValue(nextValue);
    onSelect(carerUid ?? nextValue, nameFor(nextValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the context's selection changing; reading selected/uid/displayName/dependents/onSelect here without depending on them avoids re-running this on every local update
  }, [personCtx?.personId, personCtx?.careForUid, personCtx?.careForViewerUid]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === ADD_PERSON_VALUE) {
      onAddPerson?.();
      return;
    }
    setSelected(val);
    const name = nameFor(val);
    const carerUid = parseCarerOptionValue(val);
    if (carerUid) {
      onSelect(carerUid, name);
      personCtx?.setCareFor(carerUid, name, uid);
      return;
    }
    onSelect(val, name);
    personCtx?.setPerson(val === uid ? null : val, name);
  }

  const caredForLoading = carerEnabled && caredFor === null;
  if (dependents === null || caredForLoading) {
    if (!alwaysShow) return null;
    return <Skeleton height="2.75rem" width="220px" />;
  }

  const caredForList = carerEnabled && Array.isArray(caredFor) ? caredFor : [];
  if (dependents.length === 0 && caredForList.length === 0 && !alwaysShow) return null;

  const isViewingOther = selected !== uid;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
      <label
        htmlFor="person-switcher-select"
        style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}
      >
        {label}
      </label>
      <select
        id="person-switcher-select"
        value={selected}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight: 44,
          padding: "var(--space-2) var(--space-4)",
          borderRadius: "var(--radius-input)",
          border: `1px solid ${
            isFocused
              ? "color-mix(in srgb, var(--color-primary) 42%, transparent)"
              : isViewingOther
                ? "var(--primary)"
                : "var(--color-border)"
          }`,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-primary)",
          background: isViewingOther ? "var(--color-primary-light)" : "var(--color-surface)",
          cursor: "pointer",
          boxShadow: isFocused ? "0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent)" : "none",
          transition: "border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease"
        }}
      >
        <option value={uid}>{displayLabel} (You)</option>
        {dependents.map((dep) => (
          <option key={dep.id} value={dep.id}>
            {formatPersonName(dep.name)} ({dep.relationship})
          </option>
        ))}
        {caredForList.length > 0 ? (
          <optgroup label="Caring for">
            {caredForList.map((p) => (
              <option key={p.uid} value={carerOptionValue(p.uid)}>
                {carerLabel(p)}
              </option>
            ))}
          </optgroup>
        ) : null}
        {onAddPerson ? <option value={ADD_PERSON_VALUE}>+ Add person</option> : null}
      </select>
    </div>
  );
}
