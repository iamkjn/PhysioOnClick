import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@/components/analytics";
import { ChatWidget } from "@/components/chat-widget";
import { ConnectivityOverlay } from "@/components/connectivity-overlay";
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
    images: [
      {
        url: "/home-hero-premium.svg",
        width: 1600,
        height: 1000,
        alt: "PhysioOnClick"
      }
    ],
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
        <ToastProvider>
          <ScrollReset />
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <Analytics />
          <ChatWidget />
          <ConnectivityOverlay />
        </ToastProvider>
      </body>
    </html>
  );
}
