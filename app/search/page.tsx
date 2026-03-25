import type { Metadata } from "next";

import { SearchExperience } from "@/components/search-experience";
import { getPublicSearchIndex } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Search | PhysioOnClick",
  description: "Search services, pricing and physiotherapy blog content on PhysioOnClick."
};

export const dynamic = "force-static";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; scope?: string }> }) {
  const params = await searchParams;
  const items = getPublicSearchIndex();

  return (
    <div className="site-shell">
      <section className="simple-page-hero">
        <h1>
          Search <span>PhysioOnClick</span>
        </h1>
        <p>Find services, pricing information and physiotherapy articles quickly.</p>
      </section>

      <section className="page-section">
        <SearchExperience initialQuery={params.q || ""} scope={params.scope || "general"} items={items} />
      </section>
    </div>
  );
}
