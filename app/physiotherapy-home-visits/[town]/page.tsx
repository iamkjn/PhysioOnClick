import { NoSnippet, noSnippetPrices } from "@/components/no-snippet";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactOptions } from "@/components/contact-options";
import { Reveal } from "@/components/reveal";
import { ServiceReviews } from "@/components/service-reviews";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { APPOINTMENT_HOURS } from "@/lib/appointment-hours";
import { homeVisitPriceRange } from "@/lib/home-visit-pricing";
import { POSTOP_READINESS, townFaqs, townSeoDescription, townSeoTitle } from "@/lib/home-visit-town-copy";
import { getHomeVisitTown, homeVisitTownPath, homeVisitTowns } from "@/lib/home-visit-towns";
import { founder } from "@/lib/site-data";
import { breadcrumbs, practiceRef } from "@/lib/structured-data";
import { curatedReviewsForServicesOverview } from "@/lib/trustpilot-curated";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";

// One page per town we visit (data and the rules for adding a town live in
// lib/home-visit-towns.ts). Prices, hours and the signed-off clearance
// sentences are derived here, never written per town.
//
// Statically generated per town. Deliberately no `dynamicParams = false` -
// on OpenNext that 404s every path on deploy (known repo hazard).
export const dynamic = "force-static";

const NHSGGC_SELF_REFERRAL_URL =
  "https://www.nhsggc.scot/hospitals-services/services-a-to-z/musculoskeletal-msk-physiotherapy/self-referral-to-adult-msk-physiotherapy/";

export function generateStaticParams() {
  return homeVisitTowns.map((t) => ({ town: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town: slug } = await params;
  const town = getHomeVisitTown(slug);
  if (!town) return {};
  const title = townSeoTitle(town);
  const description = townSeoDescription(town);
  return {
    title,
    description,
    alternates: { canonical: homeVisitTownPath(town.slug) },
    openGraph: { type: "website", title, description, url: homeVisitTownPath(town.slug) },
  };
}

export default async function HomeVisitTownPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town: slug } = await params;
  const town = getHomeVisitTown(slug);
  if (!town) notFound();

  const faqs = townFaqs(town);
  const otherTowns = homeVisitTowns.filter((t) => t.slug !== town.slug);
  const source = `home_visits_town_${town.slug.replace(/-/g, "_")}`;

  return (
    <div className="site-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `Physiotherapy home visits in ${town.name}`,
            about: practiceRef(),
            mainEntity: {
              "@type": "Service",
              name: `Physiotherapy home visits in ${town.name}`,
              serviceType: "Home visit physiotherapy",
              provider: practiceRef(),
              areaServed: { "@type": "City", name: town.name },
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Home visits", path: "/physiotherapy-home-visits-glasgow" },
              { name: town.name, path: homeVisitTownPath(town.slug) },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.filter((faq) => !faq.answer.includes("£")).map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }),
        }}
      />

      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Home visits &middot; {town.council}</span>
          <h1>Physiotherapy home visits in {town.name}</h1>
          <p className="lead">
            A Glasgow-based, HCPC registered physiotherapist comes to your home in {town.name}. The initial home
            assessment is <NoSnippet>{homeVisitPriceRange(town.districts).initial}</NoSnippet> and follow-ups are{" "}
            <NoSnippet>{homeVisitPriceRange(town.districts).followUp}</NoSnippet>. Cash accepted.
          </p>
          <p>
            Visits run {APPOINTMENT_HOURS.phrase}, evenings and weekends included, so you don&rsquo;t need
            to take time off work.
          </p>
          <ContactOptions
            topic="home-visit"
            source={source}
            lead={`Not sure a home visit in ${town.name} is right for you? Ask us first, with no obligation to book.`}
          />
          <div className="button-row">
            <TrackedBookLink className="button primary" href={VISIT_REQUEST_PATH} source={source} event="book_now_click">
              Request a home visit
            </TrackedBookLink>
            <TrackedBookLink
              className="button secondary"
              href="/book?pay=online&visit=home"
              source={`${source}_online`}
              event="book_now_click"
            >
              Book and pay online
            </TrackedBookLink>
          </div>
        </div>
        <div className="page-hero-aside checklist-panel stack">
          <h2>Where we visit</h2>
          <p>
            <strong>{town.name}:</strong> {town.districts.join(", ")}
          </p>
          <p>Nearby: {town.nearby.join(", ")}.</p>
          <p className="muted">Enter your postcode when you book to confirm we cover your street.</p>
        </div>
      </section>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Home physio in {town.name}</h2>
          <p>{town.intro}</p>
          <p>{town.localNote}</p>
          {town.nhsggcSelfReferralNote ? (
            <p>
              {town.name} is in NHS Greater Glasgow and Clyde, and{" "}
              <a className="inline-link" href={NHSGGC_SELF_REFERRAL_URL}>the board&rsquo;s physio self-referral</a> can&rsquo;t be used if you
              need a home visit. You can book one with us directly, without going through your GP.
            </p>
          ) : null}
        </section>
      </Reveal>

      {town.hospital ? (
        <Reveal direction="up">
          <section className="page-section stack">
            <h2>Coming home from hospital</h2>
            <p>{town.hospital.note}</p>
            <p>
              Bring your discharge letter and any precautions you were given to the first visit. We&rsquo;re a private
              service, independent of {town.hospital.board}, so we don&rsquo;t receive your hospital records.
            </p>
            <p>{POSTOP_READINESS}</p>
          </section>
        </Reveal>
      ) : null}

      <section className="page-section two-col">
        <Reveal direction="up">
          <div className="panel stack soft-panel">
            <h2>What a visit includes</h2>
            <ul className="clean-list">
              <li>An assessment at home: your history, your goals and how you move</li>
              <li>
                Hands-on treatment where appropriate, alongside exercise and advice (
                <Link className="inline-link" href="/manual-therapy-glasgow">manual therapy</Link>)
              </li>
              <li>An exercise plan set up for the space you actually have, with a written summary afterwards</li>
              <li>A family member or carer welcome to join and learn how to help</li>
            </ul>
            <p>
              <Link className="inline-link" href="/physiotherapy-home-visits-glasgow">More about home visits and how to prepare</Link>
            </p>
          </div>
        </Reveal>
        <Reveal direction="up" delay={80}>
          <div className="panel stack image-panel">
            <h2>Who you&rsquo;ll see</h2>
            <p>
              {founder.name}, {founder.credentials.join(", ")}. Visits run 7 days a week, 9am to 9pm, around
              work and family.
            </p>
            <p>
              <Link className="inline-link" href="/about">About {founder.name.split(" ")[0]}</Link> &middot;{" "}
              <Link className="inline-link" href="/pricing">All prices</Link>
            </p>
          </div>
        </Reveal>
      </section>

      <ServiceReviews reviews={curatedReviewsForServicesOverview()} />

      <Reveal direction="up">
        <section className="page-section stack service-faqs">
          <h2>{town.name} home visit questions</h2>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{noSnippetPrices(faq.answer)}</p>
            </details>
          ))}
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="page-section stack">
          <h2>Other places we visit</h2>
          <p>
            {otherTowns.map((t, i) => (
              <span key={t.slug}>
                {i > 0 ? " · " : null}
                <Link className="inline-link" href={homeVisitTownPath(t.slug)}>{t.name}</Link>
              </span>
            ))}
            {" · "}
            <Link className="inline-link" href="/physiotherapy-home-visits-glasgow">Glasgow and everywhere else we cover</Link>
          </p>
          <p>
            Outside the area? <Link className="inline-link" href="/online-physiotherapy-scotland">Video appointments</Link> work anywhere in the
            UK.
          </p>
        </section>
      </Reveal>

      <Reveal direction="up">
        <section className="simple-cta-band" id="book">
          <div className="site-shell simple-cta-inner">
            <span className="eyebrow">Ready to book?</span>
            <h2>Book a home visit in {town.name}</h2>
            <p>Leave your name and number and we&rsquo;ll call you to arrange a time, or choose a time and pay online.</p>
            <div className="button-row" style={{ justifyContent: "center" }}>
              <Link className="button secondary cta-white" href={VISIT_REQUEST_PATH}>
                Request a home visit
              </Link>
              <Link className="button inverted" href="/book?pay=online&visit=home">
                Book and pay online
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
