import type { Metadata } from "next";
import Link from "next/link";

import { guides } from "@/lib/guides";
import { stripLinks } from "@/lib/content-types";
import { withPrices } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Physio Guides: Costs, Insurance & Online Care | PhysioOnClick",
  description:
    "Plain-English guides from an HCPC-registered physiotherapist: what private physio costs, how to pay less, and how online physiotherapy fits with NHS care.",
  alternates: { canonical: "/guides" },
};

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}

export default function GuidesIndex() {
  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>Guides</h1>
        <p>
          Clear answers to common questions about physiotherapy in the UK,
          written by a physiotherapist.
        </p>
      </section>
      <section className="page-section">
        <ul>
          {guides.map((g) => (
            <li key={g.slug}>
              <h2>
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </h2>
              <p>{stripLinks(withPrices(firstSentence(g.answer)))}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
