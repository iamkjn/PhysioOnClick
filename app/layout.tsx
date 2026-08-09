import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

import { Analytics } from "@/components/analytics";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ConnectivityOverlay } from "@/components/connectivity-overlay";
import { CookieConsent } from "@/components/cookie-consent";
import { PersonProvider } from "@/components/person-provider";
import { ScrollReset } from "@/components/scroll-reset";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToastProvider } from "@/components/toast-provider";
import { siteEntityGraph } from "@/lib/structured-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://physioonclick.co.uk";

// Self-hosted via next/font/google so the font CSS + files ship from our own
// origin instead of a render-blocking fonts.googleapis.com/fonts.gstatic.com
// round trip. `variable` exposes each family as a CSS custom property that
// app/globals.css maps onto --font-serif / --font-sans.
const fraunces = Fraunces({
  subsets: ["latin"],
  // Fraunces is a variable font; "variable" ships the single variable file
  // (matching the old opsz,wght@9..144,300..900 request) instead of static
  // weight files. `axes: ["opsz"]` keeps the optical-size axis the CSS relies
  // on for headings — next/font drops non-weight axes unless named explicitly.
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: "variable",
  // Italic is used for the "TBC" label in components/admin-bookings-table.tsx,
  // so both styles must be requested or that row falls back to normal.
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PhysioOnClick | Online Physiotherapy Across the UK",
  description:
    "PhysioOnClick is a UK online physiotherapy and rehabilitation platform offering consultations across the UK.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "PhysioOnClick",
    description: "Evidence-based online physiotherapy and rehabilitation across the UK.",
    type: "website",
    siteName: "PhysioOnClick",
    locale: "en_GB",
    // Must stay a raster file at 1200x630. Facebook, LinkedIn, X, WhatsApp and
    // Slack all refuse to render SVG previews — this used to point at
    // /home-hero-premium.svg, so every share came out with no image.
    // Regenerate with `node scripts/build-og-image.js`.
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "PhysioOnClick — online physiotherapy across the UK"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PhysioOnClick",
    description: "Evidence-based online physiotherapy and rehabilitation across the UK.",
    images: ["/og-default.png"]
  },
  // Signals to content classifiers / mobile-carrier filters that this is a
  // general-audience medical site, not adult content. Helps avoid being
  // mis-categorised and blocked by default on mobile networks.
  other: {
    rating: "general",
    classification: "Health, Medical, Physiotherapy",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body>
        {/* Sitewide entity graph: the practice + practitioner, keyed by stable
            @id so every page-level JSON-LD block (about, blog, services, ...)
            can reference them instead of redeclaring the data. See
            lib/structured-data.ts for the single source of truth. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteEntityGraph()) }} />
        <PersonProvider>
          <ToastProvider>
            <ScrollReset />
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
            <Analytics />
            <AnalyticsTracker />
            {/* ChatWidget is disabled until GEMINI_API_KEY is set on the Worker.
                Without the key /api/chat 500s on every message, so showing the
                launcher would advertise a broken feature. Re-enable by restoring
                the import and this element once the secret exists. */}
            <ConnectivityOverlay />
            <CookieConsent />
          </ToastProvider>
        </PersonProvider>
      </body>
    </html>
  );
}
