import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer simple-footer">
      <div className="site-shell footer-grid">
        <div>
          <Link className="footer-brand-link" href="/">
            <h3>PhysioOnClick</h3>
          </Link>
          <p>Evidence-based physiotherapy in Glasgow and online across the UK. HCPC registered, CSP member.</p>
        </div>
        <div>
          <h4>Quick links</h4>
          <Link href="/about">About</Link>
          <Link href="/services">Services</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <h4>Services</h4>
          <Link href="/services">Musculoskeletal Physio</Link>
          <Link href="/services">Post-Surgical Rehab</Link>
          <Link href="/services">Neurological Rehab</Link>
          <Link href="/services">Paediatric Physio</Link>
          <Link href="/services">Online Consultations</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <Link href="/glasgow-physiotherapist">Glasgow, Scotland, UK</Link>
          <Link href="/contact">hello@physioonclick.co.uk</Link>
          <Link href="/contact">Contact via booking form</Link>
        </div>
      </div>
    </footer>
  );
}
