"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function SiteSearchStrip() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const config = useMemo(() => {
    if (pathname.startsWith("/blog")) {
      return { placeholder: "Search blog articles", scope: "blog" };
    }

    if (pathname.startsWith("/services")) {
      return { placeholder: "Search services and conditions", scope: "service" };
    }

    if (pathname.startsWith("/pricing")) {
      return { placeholder: "Search pricing and rehab packages", scope: "pricing" };
    }

    if (pathname.startsWith("/symptom-checker")) {
      return { placeholder: "Search symptoms, areas of pain or rehab help", scope: "symptom" };
    }

    if (pathname.startsWith("/contact")) {
      return { placeholder: "Search booking, contact or clinic help", scope: "general" };
    }

    return { placeholder: "Search services, pricing, blog articles or symptoms", scope: "general" };
  }, [pathname]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}&scope=${config.scope}` : `/search?scope=${config.scope}`);
  }

  function handleClear() {
    setQuery("");
    router.push(`/search?scope=${config.scope}`);
  }

  return (
    <div className="site-search-strip">
      <div className="site-shell">
        <form className="site-search-form" onSubmit={handleSubmit}>
          <input
            aria-label="Search the website"
            placeholder={config.placeholder}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button className="button secondary small" onClick={handleClear} type="button">
              Clear
            </button>
          ) : null}
          <button className="button primary small" type="submit">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
