import type { Metadata } from "next";

import { AdminGrowthMetricGate } from "@/components/admin-growth-metric-gate";

export const metadata: Metadata = {
  title: "Growth Detail | Admin | PhysioOnClick",
};

export const dynamic = "force-dynamic";

export default async function AdminGrowthMetricPage({
  params,
}: {
  params: Promise<{ metric: string }>;
}) {
  const { metric } = await params;
  return <AdminGrowthMetricGate metric={metric} />;
}
