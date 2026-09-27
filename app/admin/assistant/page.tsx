"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

import { AdminAiWorkspace } from "@/components/admin-ai-workspace";
import { AdminShell } from "@/components/admin-shell";
import { SkeletonRow } from "@/components/skeleton";
import { isAdminUser } from "@/lib/admin-auth";
import { auth } from "@/lib/firebase";

export default function AdminAssistantPage() {
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [checkedAdmin, setCheckedAdmin] = useState(false);

  useEffect(() => {
    if (!auth) {
      setCheckedAdmin(true);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      const isAdmin = user ? await isAdminUser(user) : false;
      setAdminUid(isAdmin ? user!.uid : null);
      setCheckedAdmin(true);
    });
  }, []);

  if (!checkedAdmin) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section stack">
            <SkeletonRow count={5} />
          </section>
        </div>
      </AdminShell>
    );
  }

  if (!adminUid) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section stack">
            <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Admin access required.{" "}
              <Link href="/admin" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Go to sign in
              </Link>
            </p>
          </section>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell backHref="/admin" backLabel="← Back to dashboard">
      <div className="site-shell">
        <section className="page-section">
          <AdminAiWorkspace adminUid={adminUid} />
        </section>
      </div>
    </AdminShell>
  );
}
