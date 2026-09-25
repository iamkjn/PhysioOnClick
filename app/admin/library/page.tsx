"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminLibraryManager } from "@/components/admin-library-manager";
import { SkeletonRow } from "@/components/skeleton";

export default function AdminLibraryPage() {
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
          <AdminLibraryManager />
        </section>
      </div>
    </AdminShell>
  );
}
