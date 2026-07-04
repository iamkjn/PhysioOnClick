import type { Metadata } from "next";
import { AdminAuthGate } from "@/components/admin-auth-gate";

export const metadata: Metadata = {
  title: "Admin Dashboard | PhysioOnClick",
  description: "Admin dashboard for bookings, enquiries and patient data."
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminAuthGate />;
}
