"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/symptom-checker", label: "Symptom Checker" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="header-wrap simple-header">
      <div className="site-shell">
        <div className="nav-row simple-nav">
          <Link className="brand simple-brand" href="/">
            <span className="brand-mark">P</span>
            <div>
              <strong>PhysioOnClick</strong>
            </div>
          </Link>
          <nav className="simple-nav-links" aria-label="Primary">
            {navItems.map((item) => (
              <Link className={isActive(item.href) ? "active" : undefined} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions simple-nav-actions">
            <Link className="call-link" href="/contact">
              Call Us
            </Link>
            <Link className="button primary small" href="/pricing#book">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
