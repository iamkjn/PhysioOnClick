import { SpecialtyLanding, specialtyMetadata } from "@/components/specialty-landing";
import { specialtyPage } from "@/lib/specialty-pages";

const page = specialtyPage("/sports-injury-physiotherapy-glasgow");

export const metadata = specialtyMetadata(page);

export default function Page() {
  return <SpecialtyLanding page={page} />;
}
