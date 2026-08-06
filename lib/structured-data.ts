// Single source of truth for the site's JSON-LD entity graph. Everything here
// is deliberately small builder functions rather than one giant object: each
// page composes only the nodes it needs, and every node that represents the
// same real-world thing (the practice, the practitioner) shares a stable @id
// so Google's structured-data parser merges the JSON-LD <script> blocks that
// appear together in one page's rendered HTML into a single graph instead of
// treating them as unrelated, duplicate entities.
//
// The practice is ONLINE-ONLY: no face-to-face appointments anywhere, so it is
// not eligible for a Google Business Profile and must not be modelled as a
// walk-in clinic. `areaServed` is the whole UK on purpose, and the address
// below is a registered business address, not a place patients attend.
//
// OWNER TODO — still missing from the public graph. Do not guess these:
//   - geo (latitude/longitude — deliberately omitted; publishing precise
//     coordinates for a non-visitable address invites map pins patients
//     would turn up to)
//   - sameAs (LinkedIn / CSP directory / other profile URLs)

import { absoluteUrl } from "@/lib/utils";
import { founder, services } from "@/lib/site-data";

const SITE = absoluteUrl("/");

/** The one canonical spelling of the practice phone number. NAP consistency is
 *  a real ranking/trust signal, so every surface (schema, footer, contact page,
 *  directory submissions) must render this identical string. */
export const PRACTICE_PHONE = "+44 7741 074518";

/** Same number in the digits-only form `tel:` links require. */
export const PRACTICE_PHONE_HREF = "tel:+447741074518";

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
    address: {
      "@type": "PostalAddress",
      streetAddress: "7 Springfield Gardens",
      addressLocality: "Glasgow",
      postalCode: "G31 4HS",
      addressCountry: "GB"
    },
    // NAP consistency depends on this exact string being reused everywhere the
    // number appears — site footer, contact page, and any directory listing.
    // Change it in one place only.
    telephone: PRACTICE_PHONE,
    email: "hello@physioonclick.co.uk",
    // Consultations are delivered remotely, never at the address above. Stating
    // the channel explicitly stops the entity reading as a walk-in clinic.
    availableChannel: {
      "@type": "ServiceChannel",
      serviceType: "Online video consultation",
      serviceUrl: absoluteUrl("/book")
    },
    // Mirrors the hours already published on /contact. If those change, change
    // both — contradicting hours are worse than none.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "13:00"
      }
    ],
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
        // The registration number is the strongest trust signal a sole
        // practitioner has: it is independently checkable against the public
        // HCPC register, which is exactly what a YMYL health entity needs.
        identifier: "PH155757",
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
