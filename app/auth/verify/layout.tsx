import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifying sign-in | PhysioOnClick",
  robots: { index: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
