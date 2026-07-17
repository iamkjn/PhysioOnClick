// components/person-switcher.tsx
"use client";

import { useEffect, useState } from "react";
import { getDependents, type Dependent } from "@/lib/dependents";
import { Skeleton } from "@/components/skeleton";
import { usePerson } from "@/components/person-provider";

const ADD_PERSON_VALUE = "__add_person__";

interface Props {
  uid: string;
  displayName: string;
  onSelect: (personId: string, name: string) => void;
  alwaysShow?: boolean;
  onAddPerson?: () => void;
}

export function PersonSwitcher({ uid, displayName, onSelect, alwaysShow = false, onAddPerson }: Props) {
  // Optional: undefined when no PersonProvider is mounted (e.g. admin pages,
  // or this component rendered in isolation) — every use below is guarded.
  const personCtx = usePerson();
  const [dependents, setDependents] = useState<Dependent[] | null>(null);
  const [selected, setSelected] = useState(() =>
    personCtx?.personId && personCtx.personId !== uid ? personCtx.personId : uid
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setDependents(null);
    getDependents(uid).then((deps) => {
      setDependents(deps);
      // Reconcile guard: if the shared context points at a person who no
      // longer exists for this uid (removed dependent, or a different
      // account signed in), fall back to self. Runs once dependents load.
      personCtx?.reconcile(uid, deps.map((d) => d.id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- personCtx.reconcile has a stable identity (useCallback); only re-run when uid changes
  }, [uid]);

  // Keep local selection (and the caller, via onSelect) in sync with the
  // shared context — e.g. another switcher instance on the same page
  // changed it, or the reconcile guard above just reset it to self.
  useEffect(() => {
    if (!personCtx) return;
    const nextId = personCtx.personId && personCtx.personId !== uid ? personCtx.personId : uid;
    if (nextId === selected) return;
    setSelected(nextId);
    const name = nextId === uid ? displayName : (dependents?.find((d) => d.id === nextId)?.name ?? "");
    onSelect(nextId, name);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the context's personId changing; reading selected/uid/displayName/dependents/onSelect here without depending on them avoids re-running this on every local update
  }, [personCtx?.personId]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === ADD_PERSON_VALUE) {
      onAddPerson?.();
      return;
    }
    setSelected(val);
    const name = val === uid ? displayName : (dependents?.find((d) => d.id === val)?.name ?? "");
    onSelect(val, name);
    personCtx?.setPerson(val === uid ? null : val, name);
  }

  if (dependents === null) {
    if (!alwaysShow) return null;
    return <Skeleton height="2.75rem" width="220px" />;
  }

  if (dependents.length === 0 && !alwaysShow) return null;

  const isViewingOther = selected !== uid;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <label
        htmlFor="person-switcher-select"
        style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}
      >
        Viewing recovery for:
      </label>
      <select
        id="person-switcher-select"
        value={selected}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight: 44,
          padding: "0.6rem 0.9rem",
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
        <option value={uid}>{displayName} (You)</option>
        {dependents.map((dep) => (
          <option key={dep.id} value={dep.id}>
            {dep.name} ({dep.relationship})
          </option>
        ))}
        {onAddPerson ? <option value={ADD_PERSON_VALUE}>+ Add person</option> : null}
      </select>
    </div>
  );
}
