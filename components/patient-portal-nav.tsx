"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The patient portal's "top selector" — a persistent tab bar mirroring the
// mobile app's bottom tabs. It highlights the active section from the current
// path, so any redirection (including the dashboard's chart links) visibly
// moves the selector. Rendered at the top of every patient page.
const TABS = [
  { href: "/patient", label: "Home" },
  { href: "/patient/recovery", label: "My Recovery" },
  { href: "/patient/appointments", label: "My Appointments" },
  { href: "/patient/people", label: "My People" },
  { href: "/patient/account", label: "My Account" },
] as const;

export function PatientPortalNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/patient" ? pathname === "/patient" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="patient-portal-nav" aria-label="Patient portal">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`patient-portal-tab${isActive(tab.href) ? " active" : ""}`}
          aria-current={isActive(tab.href) ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
