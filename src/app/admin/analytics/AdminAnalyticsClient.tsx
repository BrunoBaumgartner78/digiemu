"use client";

import dynamic from "next/dynamic";

const RevenueOverTimeChart = dynamic(
  () => import("@/components/admin/analytics/RevenueOverTimeChart"),
  { ssr: false }
);

const TopProductsBarChart = dynamic(
  () => import("@/components/admin/analytics/TopProductsBarChart"),
  { ssr: false }
);

export default function AdminAnalyticsClient() {
  return (
    <div className="space-y-6">
      <RevenueOverTimeChart />
      <TopProductsBarChart />
    </div>
  );
}
