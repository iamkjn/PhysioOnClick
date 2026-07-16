// components/person-switcher.tsx
"use client";

import { useEffect, useState } from "react";
import { getDependents, type Dependent } from "@/lib/dependents";
import { Skeleton } from "@/components/skeleton";

const ADD_PERSON_VALUE = "__add_person__";

interface Props {
  uid: string;
  displayName: string;
  onSelect: (personId: string, name: string) => void;
  alwaysShow?: boolean;
  onAddPerson?: () => void;
}

export function PersonSwitcher({ uid, displayName, onSelect, alwaysShow = false, onAddPerson }: Props) {
  const [dependents, setDependents] = useState<Dependent[] | null>(null);
  const [selected, setSelected] = useState(uid);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setDependents(null);
    getDependents(uid).then(setDependents);
  }, [uid]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === ADD_PERSON_VALUE) {
      onAddPerson?.();
      return;
    }
    setSelected(val);
    const name = val === uid ? displayName : (dependents?.find((d) => d.id === val)?.name ?? "");
    onSelect(val, name);
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
