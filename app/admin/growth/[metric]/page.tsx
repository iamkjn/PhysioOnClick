import type { Metadata } from "next";

import { AdminGrowthMetricGate } from "@/components/admin-growth-metric-gate";

export const metadata: Metadata = {
  title: "Growth Detail | Admin | PhysioOnClick",
};

export const dynamic = "force-dynamic";

export default async function AdminGrowthMetricPage({
  params,
  searchParams,
}: {
  params: Promise<{ metric: string }>;
  searchParams: Promise<{ day?: string | string[] }>;
}) {
  const { metric } = await params;
  const { day } = await searchParams;
  // ?day=YYYY-MM-DD opens the records for that UK day; anything else means today.
  return <AdminGrowthMetricGate metric={metric} day={typeof day === "string" ? day : undefined} />;
}
