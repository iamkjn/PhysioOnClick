import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@/components/analytics";
import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PhysioOnClick | Physiotherapy in Glasgow and Online Across the UK",
  description:
    "PhysioOnClick is a UK physiotherapy and rehabilitation platform offering in-person care in Glasgow and online consultations across the UK.",
  openGraph: {
    title: "PhysioOnClick",
    description: "Evidence-based physiotherapy and rehabilitation in Glasgow and online across the UK.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <Analytics />
        <ChatWidget />
      </body>
    </html>
  );
}
