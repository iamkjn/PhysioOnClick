import type { Metadata } from "next";
import Link from "next/link";

import { EXERCISE_LIBRARY_REVIEWED_ON } from "@/lib/exercise-library";
import { invoiceIssuer } from "@/lib/site-data";
import { ByLine } from "@/components/exercise-library/by-line";
import { TrackedBookLink } from "@/components/tracked-book-link";

// A single static methodology page. Same force-static reasoning as the rest of
// the library; no params, so no generateStaticParams. Deliberately no
// `dynamicParams = false` (OpenNext deploy hazard).
export const dynamic = "force-static";

const TITLE = "How we make this library | PhysioOnClick";
const DESCRIPTION =
  "How the PhysioOnClick exercise library is drafted, clinically reviewed by an HCPC-registered physiotherapist, kept current, and how to report a concern.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/exercises/how-we-make-this" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/exercises/how-we-make-this",
  },
};

export default function HowWeMakeThisPage() {
  return (
    <div className="site-shell">
      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <Link href="/exercises">Exercise library</Link>
        <span className="muted" aria-hidden="true">
          {" "}
          /{" "}
        </span>
        <span className="muted" aria-current="page">
          How we make this
        </span>
      </nav>

      <section className="simple-page-hero">
        <span className="eyebrow">Exercise library</span>
        <h1>How we make this library</h1>
        <p>
          Every page in the exercise library is here to help you move with more
          confidence between physiotherapy appointments. This is how each one is
          put together.
        </p>
      </section>

      <section className="exlib-index-section exlib-prose">
        <ByLine reviewedOn={EXERCISE_LIBRARY_REVIEWED_ON} />

        <h2>Drafting</h2>
        <p>
          Each exercise and each condition programme starts from a shared house
          style: plain UK English, calm and never alarmist, and written for a
          general reader rather than a clinician. A first draft sets out the
          setup, the steps, the common mistakes, and a realistic idea of how much
          to do and when to progress.
        </p>

        <h2>Clinical review</h2>
        <p>
          An HCPC-registered physiotherapist then clinically reviews every
          exercise before we publish it. Nothing goes live until it has been
          checked for safety, for accuracy, and for the red-flag advice that
          tells you when to stop and get assessed in person.
        </p>

        <h2>Evidence</h2>
        <p>
          The content is based on current UK clinical guidelines and
          peer-reviewed rehabilitation research, written for a UK audience. Where
          the evidence is genuinely uncertain we say so, rather than overstating
          what exercise on its own can do.
        </p>

        <h2>Keeping it current</h2>
        <p>
          We re-review every exercise and programme at least once every twelve
          months, and sooner whenever national clinical guidance changes or new
          research shifts the picture.
        </p>

        <h2>Telling us about a problem</h2>
        <p>
          If you think something here is wrong, unclear, or unsafe, please tell
          us at{" "}
          <a href={`mailto:${invoiceIssuer.contactEmail}`}>
            {invoiceIssuer.contactEmail}
          </a>{" "}
          or through the <Link href="/contact">contact page</Link>, and a
          physiotherapist will look at it.
        </p>

        <p>
          This library is general information, not a personal diagnosis or
          treatment plan. Please read our{" "}
          <Link href="/medical-disclaimer">medical disclaimer</Link>, and book an
          assessment if you want advice for your own situation.
        </p>
      </section>

      <section className="simple-cta-band">
        <div className="site-shell simple-cta-inner">
          <span className="eyebrow">Want advice for your situation?</span>
          <h2>Book an online assessment</h2>
          <p>
            Get a rehab plan matched to your condition and stage from an
            HCPC-registered physiotherapist, wherever you are in the UK.
          </p>
          <TrackedBookLink
            className="button secondary cta-white"
            href="/book"
            serviceSlug="musculoskeletal-physiotherapy"
            source="exercise-library-methodology"
          >
            Book assessment
          </TrackedBookLink>
        </div>
      </section>
    </div>
  );
}
