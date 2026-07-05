"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`header-wrap simple-header${scrolled ? " header-wrap--scrolled" : ""}`}>
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
                <Link
                  key={item.href}
                  className={isActive(item.href) ? "active" : undefined}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="nav-actions simple-nav-actions">
              <Link className="call-link" href="/contact">
                Contact Us
              </Link>
              <Link className="button primary small" href="/book">
                Book Now
              </Link>
            </div>
            <button
              className={`hamburger${menuOpen ? " hamburger--open" : ""}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-nav-backdrop${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <nav
        className={`mobile-nav-panel${menuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link${isActive(item.href) ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="button primary mobile-nav-book"
          href="/book"
          onClick={() => setMenuOpen(false)}
        >
          Book Now
        </Link>
      </nav>
    </>
  );
}
