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
    return <Skeleton height="2.4rem" width="220px" />;
  }

  if (dependents.length === 0 && !alwaysShow) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: "#0C2A38" }}>
        Viewing recovery for:
      </label>
      <select
        value={selected}
        onChange={handleChange}
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: 10,
          border: "1px solid #D1E8EE",
          fontSize: 14,
          color: "#0C2A38",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <option value={uid}>{displayName} (Me)</option>
        {dependents.map((dep) => (
          <option key={dep.id} value={dep.id}>
            {dep.name} ({dep.relationship})
          </option>
        ))}
        {onAddPerson ? <option value={ADD_PERSON_VALUE}>+ Add a person</option> : null}
      </select>
    </div>
  );
}
