import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PhysioOnClick | Online Physiotherapy Across the UK",
  description:
    "PhysioOnClick is a UK online physiotherapy and rehabilitation platform offering consultations across the UK.",
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
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name: "PhysioOnClick",
          description: "Evidence-based physiotherapy and rehabilitation in Glasgow and online across the UK.",
          medicalSpecialty: "Physiotherapy",
          areaServed: "United Kingdom",
          url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          address: { "@type": "PostalAddress", addressLocality: "Glasgow", addressCountry: "GB" }
        }) }} />
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
