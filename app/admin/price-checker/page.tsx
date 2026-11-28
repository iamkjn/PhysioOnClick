import type { Metadata } from "next";
import { AdminOwnerPage } from "@/components/admin-owner-page";
import { AdminPriceChecker } from "@/components/admin-price-checker";

export const metadata: Metadata = { title: "Price checker | PhysioOnClick", robots: { index: false, follow: false } };

export default function AdminPriceCheckerPage() {
  return (
    <AdminOwnerPage>
      <AdminPriceChecker />
    </AdminOwnerPage>
  );
}
