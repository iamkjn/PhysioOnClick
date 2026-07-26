// components/admin-shell.tsx
"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { auth } from "@/lib/firebase";

interface AdminShellProps {
  /** Path for the header's back link. Omit to render no back link (the root dashboard). */
  backHref?: string;
  /** Text for the back link, e.g. "← Dashboard". Ignored if backHref is omitted. */
  backLabel?: string;
  children: React.ReactNode;
}

// The sticky navy admin header — was copy-pasted verbatim across
// admin-dashboard.tsx, admin-chat-logs-gate.tsx and app/admin/recovery/page.tsx.
// Extracted once here; all three (plus the new /admin/patients pages) render
// this instead of their own copy. Relies on the caller only mounting this
// once the admin gate has already resolved (auth.currentUser is populated by
// then), same assumption the original inline headers made.
export function AdminShell({ backHref, backLabel, children }: AdminShellProps) {
  const user = auth?.currentUser;

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    window.location.reload();
  }

  return (
    <div className="admin-app-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            P
          </div>
          <span className="admin-brand-name">
            PhysioOnClick
          </span>
          <span className="admin-badge">
            Admin
          </span>
        </div>
        <div className="admin-topbar-actions">
          {backHref && (
            <Link
              href={backHref}
              className="admin-back-link"
            >
              {backLabel ?? "← Back"}
            </Link>
          )}
          {user?.email && (
            <span className="admin-user-email">
              {user.email}
            </span>
          )}
          <button
            onClick={() => void handleSignOut()}
            className="admin-signout"
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
