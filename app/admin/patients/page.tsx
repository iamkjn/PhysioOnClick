// app/admin/patients/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminPatientsList } from "@/components/admin-patients-list";
import { SkeletonRow } from "@/components/skeleton";

// Same client-side auth-check pattern as app/admin/recovery/page.tsx (this
// route isn't wrapped by the shared components/admin-auth-gate.tsx, which is
// hardwired to always render AdminDashboard).
export default function AdminPatientsPage() {
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) { setCheckedAdmin(true); return; }
    return onAuthStateChanged(auth, async (user) => {
      setIsAdmin(user ? await isAdminUser(user) : false);
      setCheckedAdmin(true);
    });
  }, []);

  if (!checkedAdmin) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section">
            <SkeletonRow count={6} />
          </section>
        </div>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section stack">
            <p className="muted" style={{ fontSize: 14 }}>
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
          <AdminPatientsList />
        </section>
      </div>
    </AdminShell>
  );
}
