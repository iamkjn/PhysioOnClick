// Single source of truth for the site's JSON-LD entity graph. Everything here
// is deliberately small builder functions rather than one giant object: each
// page composes only the nodes it needs, and every node that represents the
// same real-world thing (the practice, the practitioner) shares a stable @id
// so Google's structured-data parser merges the JSON-LD <script> blocks that
// appear together in one page's rendered HTML into a single graph instead of
// treating them as unrelated, duplicate entities.
//
// The practice is online-first, with online physiotherapy across the UK and
// in-person care available in Glasgow. `areaServed` is the whole UK on purpose,
// while the address below represents the Glasgow business location.
//
// OWNER TODO — still missing from the public graph. Do not guess these:
//   - geo (latitude/longitude — deliberately omitted; publishing precise
//     coordinates for a non-visitable address invites map pins patients
//     would turn up to)
//   - sameAs for Facebook once the page is created

import { absoluteUrl } from "@/lib/utils";
import { founder, services } from "@/lib/site-data";
import { getCondition } from "@/lib/exercise-library";
import type { Exercise } from "@/lib/exercises";
import type { Condition } from "@/lib/conditions";
import type { SelfTest } from "@/lib/self-tests";

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
    logo: absoluteUrl("/social/physioonclick-avatar.png"),
    image: absoluteUrl("/og-default.png"),
    sameAs: [
      "https://www.instagram.com/physioonclick/",
      "https://www.tiktok.com/@physioonclick",
      "https://www.youtube.com/@PhysioOnclick"
    ],
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

// --- Public exercise library (Phase 1) --------------------------------------
//
// Google retired the HowTo and FAQPage rich results, so these builders never
// emit `@type: "HowTo"` or `@type: "FAQPage"`. The exercise step list and the
// condition FAQ are rendered as plain semantic HTML on the pages themselves;
// here they ride along inside a `MedicalWebPage` (the step list implicitly, the
// FAQ as bare `Question`/`Answer` nodes under `mainEntity`), which stays valid
// and machine-readable without triggering a dead rich result.
//
// Phase 1 has no per-exercise clinical review date, so exercise pages share one
// module constant. Condition hubs already carry their own `reviewedOn`.
const REVIEW_DATE = "2026-09-08";

/** Trim `text` to a single, tidy ~155-character sentence fragment for use as a
 *  meta-style `description`. Cuts on a word boundary and adds an ellipsis only
 *  when it actually truncated. Uses "..." not the U+2026 glyph — house style
 *  keeps this content ASCII/Latin-1 (see tests/lib/conditions.test.ts). */
function shortDescription(text: string, max = 152): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const cut = slice.slice(0, slice.lastIndexOf(" ")).trimEnd().replace(/[.,;:]$/, "");
  return `${cut || slice.trimEnd()}...`;
}

/** `MedicalWebPage` for a single exercise page. Reuses the sitewide
 *  practitioner node by @id (`personRef()`) for both `author` and `reviewedBy`
 *  rather than re-declaring the Person here. */
export function exerciseWebPage(ex: Exercise, path: string): object {
  const condition = ex.condition?.trim();
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${ex.title} exercise`,
    description: shortDescription(ex.setup ?? ex.description ?? ""),
    url: absoluteUrl(path),
    ...(condition
      ? { about: { "@type": "MedicalCondition", name: condition } }
      : {}),
    author: personRef(),
    reviewedBy: personRef(),
    lastReviewed: REVIEW_DATE,
    inLanguage: "en-GB",
    isPartOf: { "@id": absoluteUrl("/exercises") }
  };
}

/** `MedicalWebPage` for a condition hub. The FAQ is carried as `mainEntity`
 *  `Question`/`Answer` nodes — NOT wrapped in a `FAQPage` type, which is valid
 *  inside a web page and does not trigger the retired FAQ rich result. */
export function conditionWebPage(c: Condition, path: string): object {
  const alternateName = c.aka && c.aka.length > 0 ? c.aka : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: c.seoTitle,
    description: c.seoDescription,
    url: absoluteUrl(path),
    about: {
      "@type": "MedicalCondition",
      name: c.name,
      ...(alternateName ? { alternateName } : {})
    },
    author: personRef(),
    reviewedBy: personRef(),
    lastReviewed: c.reviewedOn,
    inLanguage: "en-GB",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
}

/** `MedicalWebPage` for a single self-check test page.
 *
 *  Deliberately NOT `MedicalTest` or `MedicalGuideline` (spec 11a "Schema"):
 *  those types assert a validated clinical instrument, and these pages are
 *  informational triage that explicitly cannot rule a condition in or out. The
 *  numbered step list rides along implicitly inside the web page, exactly as on
 *  the exercise pages - never `HowTo` or `FAQPage`. */
export function selfTestWebPage(t: SelfTest, path: string): object {
  const firstSlug = t.conditionSlugs[0];
  const aboutName = firstSlug
    ? (getCondition(firstSlug)?.name ?? firstSlug)
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: `${t.name} - self-check test`,
    description: shortDescription(t.whatItChecks),
    url: absoluteUrl(path),
    ...(aboutName
      ? { about: { "@type": "MedicalCondition", name: aboutName } }
      : {}),
    author: personRef(),
    reviewedBy: personRef(),
    lastReviewed: t.reviewedOn,
    inLanguage: "en-GB",
    isPartOf: { "@id": absoluteUrl("/exercises/tests") }
  };
}

/** A `VideoObject` for an exercise's demo video, or `null` when there is no
 *  structured video to describe. Every current exercise returns `null`: a bare
 *  embed URL does not satisfy Google's VideoObject requirements (name,
 *  thumbnailUrl, uploadDate, contentUrl/embedUrl), so this stays a stub until
 *  Phase 4 adds a real `videoObject` field to `Exercise`. */
export function exerciseVideoObject(ex: Exercise): object | null {
  const video = (ex as { videoObject?: Record<string, unknown> }).videoObject;
  if (!video) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    ...video
  };
}
