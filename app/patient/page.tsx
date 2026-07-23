import type { Metadata } from "next";

import { PatientHome } from "@/components/patient-home";

export const metadata: Metadata = {
  title: "Patient Portal | PhysioOnClick",
  description: "Secure patient portal for appointments, invoices, document uploads and rehab tracking."
};

export default function PatientPage() {
  return (
    <div className="site-shell patient-page">
      <PatientHome />
    </div>
  );
}
