"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { SkeletonRow } from "@/components/skeleton";
import { useIsOwner } from "@/lib/use-is-owner";

/** Page frame for the practice owner's tools. The APIs check again server-side. */
export function AdminOwnerPage({ children }: { children: React.ReactNode }) {
  const owner = useIsOwner();
  return (
    <AdminShell backHref="/admin" backLabel="Back to dashboard">
      <div className="site-shell">
        <section className="page-section stack">
          {owner === null ? (
            <SkeletonRow count={4} />
          ) : owner ? (
            children
          ) : (
            <p className="muted">
              This page isn&apos;t available on your account. <Link href="/admin">Go to the admin overview</Link>
            </p>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
