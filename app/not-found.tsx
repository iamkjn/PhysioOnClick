import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Page not found | PhysioOnClick",
  description: "The page you're looking for doesn't exist. Find your way back to PhysioOnClick's services, pricing, blog or search."
};

export default function NotFound() {
  return (
    <div className="site-shell">
      <Reveal direction="fade">
      <section className="page-hero stack">
        <span className="eyebrow">Page not found</span>
        <h1>We couldn&apos;t find that page.</h1>
        <p className="lead">
          The page may have moved or the link may be out of date. Try one of these instead.
        </p>
        <nav className="button-row" aria-label="Helpful links">
          <Link className="button primary" href="/">
            Return home
          </Link>
          <Link className="button secondary" href="/services">
            Browse services
          </Link>
          <Link className="button secondary" href="/blog">
            Read the blog
          </Link>
          <Link className="button secondary" href="/search">
            Search the site
          </Link>
        </nav>
      </section>
      </Reveal>
    </div>
  );
}
