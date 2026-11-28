import type { Metadata } from "next";
import { AdminAppointmentForm } from "@/components/admin-appointment-form";
import { AdminOwnerPage } from "@/components/admin-owner-page";

export const metadata: Metadata = { title: "Add appointment | PhysioOnClick", robots: { index: false, follow: false } };

export default function AdminAppointmentsPage() {
  return (
    <AdminOwnerPage>
      <AdminAppointmentForm />
    </AdminOwnerPage>
  );
}
