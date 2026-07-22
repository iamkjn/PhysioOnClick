"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useGSAP } from "@/hooks/use-gsap-timeline";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

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
  const headerRef = useRef<HTMLElement>(null);
  const underlineRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;

    const target = scrolled
      ? {
          backgroundColor: "rgba(255,255,255,0.85)",
          boxShadow: "0 2px 20px rgba(13,27,42,0.08)",
          borderBottomColor: "transparent",
        }
      : {
          backgroundColor: "#ffffff",
          boxShadow: "0 0 0 rgba(13,27,42,0)",
          // GSAP tweens this as a literal color value (not resolved through the
          // DOM's CSS custom-property cascade), so use the Clarity border hex
          // directly rather than var(--color-border).
          borderBottomColor: "#E4DED1",
        };

    gsap.to(header, {
      ...target,
      duration: prefersReducedMotion() ? 0 : 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [scrolled]);

  useGSAP(() => {
    navItems.forEach((item) => {
      const el = underlineRefs.current[item.href];
      if (!el) return;
      const target = isActive(item.href)
        ? { width: 20, opacity: 1 }
        : { width: 0, opacity: 0 };
      gsap.to(el, {
        ...target,
        duration: prefersReducedMotion() ? 0 : 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, [pathname]);

  function handleNavHoverStart(href: string) {
    if (isActive(href) || prefersReducedMotion()) return;
    const el = underlineRefs.current[href];
    if (el) gsap.to(el, { width: 16, opacity: 0.4, duration: 0.2, ease: "power2.out" });
  }

  function handleNavHoverEnd(href: string) {
    if (isActive(href) || prefersReducedMotion()) return;
    const el = underlineRefs.current[href];
    if (el) gsap.to(el, { width: 0, opacity: 0, duration: 0.2, ease: "power2.out" });
  }

  useGSAP(() => {
    const button = hamburgerRef.current;
    if (!button) return;
    const bars = button.querySelectorAll("span");
    if (bars.length !== 3) return;

    const [top, middle, bottom] = Array.from(bars);
    const duration = prefersReducedMotion() ? 0 : 0.25;
    const ease = "power2.inOut";

    if (menuOpen) {
      gsap.to(top, { rotate: 45, y: 6, duration, ease, overwrite: "auto" });
      gsap.to(middle, { opacity: 0, duration: duration * 0.6, ease, overwrite: "auto" });
      gsap.to(bottom, { rotate: -45, y: -6, duration, ease, overwrite: "auto" });
    } else {
      gsap.to(top, { rotate: 0, y: 0, duration, ease, overwrite: "auto" });
      gsap.to(middle, { opacity: 1, duration, ease, overwrite: "auto" });
      gsap.to(bottom, { rotate: 0, y: 0, duration, ease, overwrite: "auto" });
    }
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

  // The admin dashboard ships its own header and nav. Rendering the public
  // marketing chrome above it stacks two headers and shows patient-facing
  // links that make no sense there. Placed after every hook, not before, so
  // hook order stays stable across renders.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header ref={headerRef} className={`header-wrap simple-header${scrolled ? " header-wrap--scrolled" : ""}`}>
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
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onMouseEnter={() => handleNavHoverStart(item.href)}
                  onMouseLeave={() => handleNavHoverEnd(item.href)}
                >
                  {item.label}
                  <span
                    className="nav-underline"
                    aria-hidden="true"
                    ref={(el) => {
                      underlineRefs.current[item.href] = el;
                    }}
                  />
                </Link>
              ))}
            </nav>
            <div className="nav-actions simple-nav-actions">
              {user ? (
                <button type="button" className="call-link" style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              ) : (
                <Link className="call-link" href="/patient">
                  Sign In
                </Link>
              )}
              {/* "Contact" already lives in the primary nav above (line ~17);
                  this used to duplicate it as "Contact Us" right next to it. */}
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
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link${isActive(item.href) ? " active" : ""}`}
            aria-current={isActive(item.href) ? "page" : undefined}
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
        ) : (
          <Link
            className="mobile-nav-link"
            href="/patient"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
        )}
      </nav>
    </>
  );
}
