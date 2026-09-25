"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { AdminNotificationBell } from "@/components/admin-notification-bell";

interface AdminShellProps {
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  aliases?: string[];
};

const PRIMARY_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays, aliases: ["/admin/session"] },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/recovery", label: "Recovery tools", icon: Activity },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
];

const SECONDARY_NAV: AdminNavItem[] = [
  { href: "/admin/chat-logs", label: "Chat logs", icon: MessageSquare },
];

function isActivePath(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href
    || pathname.startsWith(`${item.href}/`)
    || item.aliases?.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
}

function cleanBackLabel(label?: string) {
  return (label ?? "Back").replace(/^←\s*/, "");
}

export function AdminShell({ backHref, backLabel, children }: AdminShellProps) {
  const pathname = usePathname();
  const user = auth?.currentUser;
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [pathname]);

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    window.location.reload();
  }

  const currentItem = [...PRIMARY_NAV, ...SECONDARY_NAV].find((item) => isActivePath(pathname, item));

  function renderNav(items: AdminNavItem[]) {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActivePath(pathname, item);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`admin-side-link${active ? " is-active" : ""}`}
          aria-current={active ? "page" : undefined}
        >
          <Icon aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      );
    });
  }

  return (
    <div className={`admin-app-shell${navOpen ? " is-nav-open" : ""}`}>
      <aside className="admin-sidebar" id="admin-primary-navigation" aria-label="Admin navigation">
        <Link href="/admin" className="admin-sidebar-brand" aria-label="PhysioOnClick admin overview">
          <span className="admin-brand-mark" aria-hidden="true">P</span>
          <span className="admin-sidebar-brand-copy">
            <strong>PhysioOnClick</strong>
            <small>Practice admin</small>
          </span>
        </Link>

        <nav className="admin-side-nav">
          <span className="admin-side-nav-label">Workspace</span>
          {renderNav(PRIMARY_NAV)}
          <span className="admin-side-nav-label admin-side-nav-label--secondary">Support</span>
          {renderNav(SECONDARY_NAV)}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-side-link">
            <ExternalLink aria-hidden="true" />
            <span>Open website</span>
          </a>
          {user?.email && (
            <div className="admin-account-summary">
              <span className="admin-account-avatar" aria-hidden="true">
                {user.email.charAt(0).toUpperCase()}
              </span>
              <span>
                <strong>Administrator</strong>
                <small>{user.email}</small>
              </span>
            </div>
          )}
          <button type="button" onClick={() => void handleSignOut()} className="admin-side-link admin-signout">
            <LogOut aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="admin-shell-main">
        <header className="admin-topbar">
          <div className="admin-topbar-leading">
            <button
              type="button"
              className="admin-menu-button"
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navOpen}
              aria-controls="admin-primary-navigation"
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            {backHref ? (
              <Link href={backHref} className="admin-back-link">
                <ArrowLeft aria-hidden="true" />
                <span>{cleanBackLabel(backLabel)}</span>
              </Link>
            ) : (
              <div className="admin-page-context">
                <span>Admin workspace</span>
                <strong>{currentItem?.label ?? "Overview"}</strong>
              </div>
            )}
          </div>
          <div className="admin-topbar-actions">
            <AdminNotificationBell />
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-website-link">
              <span>View site</span>
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </header>
        <div className="admin-shell-content">{children}</div>
      </div>

      <button
        type="button"
        className="admin-nav-scrim"
        aria-label="Dismiss navigation"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />
    </div>
  );
}
