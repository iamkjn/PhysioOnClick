"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { AuthPanel } from "@/components/auth-panel";
import { SkeletonForm } from "@/components/skeleton";

export function PatientAuthGate() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user === undefined) {
    return (
      <div className="panel auth-panel">
        <SkeletonForm fields={2} />
      </div>
    );
  }

  if (user) return null;

  return <AuthPanel role="patient" />;
}
