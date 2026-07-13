"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useGSAP } from "@/hooks/use-gsap-timeline";
import { gsap } from "@/lib/gsap";

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
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const hamburgerRef = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const button = hamburgerRef.current;
    if (!button) return;
    const bars = button.querySelectorAll("span");
    if (bars.length !== 3) return;

    const [top, middle, bottom] = Array.from(bars);

    const mm = gsap.matchMedia();
    mm.add(
      {
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          if (menuOpen) {
            gsap.set(top, { rotate: 45, y: 6 });
            gsap.set(middle, { opacity: 0 });
            gsap.set(bottom, { rotate: -45, y: -6 });
          } else {
            gsap.set(top, { rotate: 0, y: 0 });
            gsap.set(middle, { opacity: 1 });
            gsap.set(bottom, { rotate: 0, y: 0 });
          }
          return;
        }

        const duration = 0.25;
        const ease = "power2.inOut";

        if (menuOpen) {
          gsap.to(top, { rotate: 45, y: 6, duration, ease });
          gsap.to(middle, { opacity: 0, duration: duration * 0.6, ease });
          gsap.to(bottom, { rotate: -45, y: -6, duration, ease });
        } else {
          gsap.to(top, { rotate: 0, y: 0, duration, ease });
          gsap.to(middle, { opacity: 1, duration, ease });
          gsap.to(bottom, { rotate: 0, y: 0, duration, ease });
        }
      }
    );

    return () => mm.revert();
  }, [menuOpen]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

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
              {user ? (
                <button type="button" className="call-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              ) : null}
              <Link className="call-link" href="/contact">
                Contact Us
              </Link>
              <Link className="button primary small" href="/book">
                Book Now
              </Link>
            </div>
            <button
              ref={hamburgerRef}
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
        {user ? (
          <button
            type="button"
            className="mobile-nav-link"
            style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        ) : null}
      </nav>
    </>
  );
}
