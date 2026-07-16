import Link from "next/link";

import { Reveal } from "@/components/reveal";

export default function NotFound() {
  return (
    <div className="site-shell">
      <Reveal direction="fade">
      <section className="page-hero stack">
        <span className="eyebrow">Page not found</span>
        <h1>We couldn&apos;t find that page.</h1>
        <p className="lead">Try the homepage, services page or blog library to continue browsing PhysioOnClick.</p>
        <Link className="button primary" href="/">
          Return home
        </Link>
      </section>
      </Reveal>
    </div>
  );
}
