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
  title: "PhysioOnClick | Physiotherapy in Glasgow and Online Across the UK",
  description:
    "PhysioOnClick is a UK physiotherapy and rehabilitation platform offering in-person care in Glasgow and online consultations across the UK.",
  openGraph: {
    title: "PhysioOnClick",
    description: "Evidence-based physiotherapy and rehabilitation in Glasgow and online across the UK.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
