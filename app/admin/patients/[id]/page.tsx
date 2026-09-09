// app/admin/patients/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminPatientDetail } from "@/components/admin-patient-detail";
import { SkeletonRow } from "@/components/skeleton";

// Same client-side auth-check pattern as app/admin/recovery/page.tsx.
export default function AdminPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // `?person=<dependentId>` deep link from the patients list. Read straight from
  // the URL in a lazy initializer (client-only) to avoid a useSearchParams
  // Suspense boundary and any first-render flash of the primary's records.
  const [initialPersonId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("person") || undefined;
  });

  useEffect(() => {
    if (!auth) { setCheckedAdmin(true); return; }
    return onAuthStateChanged(auth, async (user) => {
      setIsAdmin(user ? await isAdminUser(user) : false);
      setCheckedAdmin(true);
    });
  }, []);

  if (!checkedAdmin) {
    return (
      <AdminShell backHref="/admin/patients" backLabel="← Back to patients">
        <div className="site-shell">
          <section className="page-section">
            <SkeletonRow count={5} />
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

  if (!id) return null;

  return (
    <AdminShell backHref="/admin/patients" backLabel="← Back to patients">
      <div className="site-shell">
        <section className="page-section">
          <AdminPatientDetail patientUid={id} initialPersonId={initialPersonId} />
        </section>
      </div>
    </AdminShell>
  );
}
