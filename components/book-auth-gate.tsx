"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { AuthPanel } from "@/components/auth-panel";
import { CalEmbed } from "@/components/cal-embed";
import { SkeletonForm } from "@/components/skeleton";

export function BookAuthGate() {
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
      <div className="book-auth-gate">
        <SkeletonForm fields={2} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="book-auth-gate">
        <p className="lead">Sign in or create a free account to book your appointment.</p>
        <AuthPanel role="patient" />
      </div>
    );
  }

  return <CalEmbed />;
}
