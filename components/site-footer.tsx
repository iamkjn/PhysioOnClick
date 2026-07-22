"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  // Hidden on the admin dashboard for the same reason as SiteHeader — the
  // marketing footer's patient links don't belong in the back office.
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="footer simple-footer">
      <div className="site-shell footer-grid">
        <div>
          <Link className="footer-brand-link" href="/">
            <h3>PhysioOnClick</h3>
          </Link>
          <p>Evidence-based physiotherapy online across the UK. HCPC registered, CSP member.</p>
        </div>
        <div>
          <h4>Quick links</h4>
          <Link href="/about">About</Link>
          <Link href="/services">Services</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/cancellation-policy">Cancellation Policy</Link>
          <Link href="/medical-disclaimer">Medical Disclaimer</Link>
          <Link href="/professional-standards">Professional Standards</Link>
        </div>
        <div>
          <h4>Services</h4>
          <Link href="/services#musculoskeletal-physiotherapy">Musculoskeletal Physio</Link>
          <Link href="/services#post-surgical-rehabilitation">Post-Surgical Rehab</Link>
          <Link href="/services#neurological-rehabilitation">Neurological Rehab</Link>
          <Link href="/services#paediatric-physiotherapy">Paediatric Physio</Link>
          <Link href="/services#online-rehab-programmes">Online Consultations</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <Link href="/glasgow-physiotherapist">Online physio for Glasgow patients</Link>
          <a href="mailto:hello@physioonclick.co.uk">hello@physioonclick.co.uk</a>
          <Link href="/contact">Contact form</Link>
        </div>
      </div>
    </footer>
  );
}
