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
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--color-navy)",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 16,
              fontFamily: "var(--font-serif)",
            }}
          >
            P
          </div>
          <span style={{ color: "white", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15 }}>
            PhysioOnClick
          </span>
          <span
            style={{
              border: "1px solid var(--color-gold)",
              color: "var(--color-gold)",
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.04em",
            }}
          >
            Admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {backHref && (
            <Link
              href={backHref}
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
              }}
            >
              {backLabel ?? "← Back"}
            </Link>
          )}
          {user?.email && (
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-sans)" }}>
              {user.email}
            </span>
          )}
          <button
            onClick={() => void handleSignOut()}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              minHeight: 44,
              padding: "0 0.25rem",
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
