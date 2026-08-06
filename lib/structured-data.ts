// Single source of truth for the site's JSON-LD entity graph. Everything here
// is deliberately small builder functions rather than one giant object: each
// page composes only the nodes it needs, and every node that represents the
// same real-world thing (the practice, the practitioner) shares a stable @id
// so Google's structured-data parser merges the JSON-LD <script> blocks that
// appear together in one page's rendered HTML into a single graph instead of
// treating them as unrelated, duplicate entities.
//
// OWNER TODO — facts intentionally left out of the public graph because they
// are not verified/published anywhere yet. Do not fill these in with guesses;
// wire them in here once the owner supplies them:
//   - telephone (no published business phone number)
//   - address.streetAddress + address.postalCode (only city/country is public)
//   - geo (latitude/longitude for the practice address)
//   - HCPC registration number (used privately on invoices via
//     lib/site-data.ts `invoiceIssuer.hcpcNumber`, but that is a private
//     billing address/number, not confirmed for public disclosure — do not
//     reuse it here without the owner's explicit sign-off)
//   - sameAs (LinkedIn/Instagram/etc. profile URLs)

import { absoluteUrl } from "@/lib/utils";
import { founder, services } from "@/lib/site-data";

const SITE = absoluteUrl("/");

/** Stable @id for the practice entity — every page that mentions the
 *  business links back to this one node instead of re-declaring it. */
export const PRACTICE_ID = `${SITE}#practice`;

/** Stable @id for the practitioner entity (Shivaliba Zala). */
export const PERSON_ID = `${SITE}#shivaliba`;

const AREA_SERVED_UK = { "@type": "Country", name: "United Kingdom" } as const;

/** Reference-only pointer at the practice node, for pages/entities that need
 *  to link to it (e.g. `publisher`, `provider`) without repeating its data. */
export function practiceRef() {
  return { "@id": PRACTICE_ID };
}

/** Reference-only pointer at the practitioner node. */
export function personRef() {
  return { "@id": PERSON_ID };
}

/** The full practice entity. Emit this once sitewide (app/layout.tsx); every
 *  other page should use practiceRef() instead of redeclaring it. */
export function practiceNode() {
  return {
    "@type": ["MedicalBusiness", "Physiotherapy"],
    "@id": PRACTICE_ID,
    name: "PhysioOnClick",
    url: SITE,
    description:
      "Evidence-based physiotherapy and rehabilitation in Glasgow and online across the UK.",
    medicalSpecialty: "Physiotherapy",
    areaServed: AREA_SERVED_UK,
    address: { "@type": "PostalAddress", addressLocality: "Glasgow", addressCountry: "GB" },
    email: "hello@physioonclick.co.uk",
    // og-default.png is the real committed 1200x630 social-share image; reused
    // here rather than inventing a separate logo asset.
    logo: absoluteUrl("/og-default.png"),
    image: absoluteUrl("/og-default.png"),
    founder: personRef()
  };
}

/** The full practitioner entity. Emit this once sitewide alongside the
 *  practice node; other pages should use personRef() instead. */
export function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: founder.name,
    jobTitle: "Physiotherapist",
    url: absoluteUrl("/about"),
    worksFor: practiceRef(),
    alumniOf: { "@type": "CollegeOrUniversity", name: "University of Dundee" },
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: "MSc Orthopaedic & Rehabilitation Technology",
        recognizedBy: { "@type": "CollegeOrUniversity", name: "University of Dundee" }
      },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "license",
        name: "HCPC Registered Physiotherapist",
        // No registration number published — see OWNER TODO above.
        recognizedBy: {
          "@type": "Organization",
          name: "Health and Care Professions Council",
          alternateName: "HCPC"
        }
      }
    ],
    memberOf: { "@type": "Organization", name: "Chartered Society of Physiotherapy", alternateName: "CSP" },
    knowsAbout: services.map((service) => service.title)
  };
}

/** Sitewide graph: the practice + practitioner, emitted once from
 *  app/layout.tsx so every page shares the same two nodes by @id. */
export function siteEntityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [practiceNode(), personNode()]
  };
}

export type BreadcrumbItem = { name: string; path: string };

/** BreadcrumbList from an ordered [{name, path}] array, path relative to site
 *  root (e.g. "/", "/blog", "/blog/my-post"). */
export function breadcrumbs(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

/** Service entity builder, consumed by the service detail pages. Kept generic
 *  over slug/title/summary so callers don't need the full Service shape from
 *  lib/site-data.ts. */
export function serviceSchema(service: { slug: string; title: string; summary: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalTherapy",
    name: service.title,
    description: service.summary,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: practiceRef(),
    areaServed: AREA_SERVED_UK
  };
}
