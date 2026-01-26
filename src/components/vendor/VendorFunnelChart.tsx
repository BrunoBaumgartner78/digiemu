"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type VendorFunnel = {
  impressions?: number;
  views?: number;
  purchases?: number;
  viewRate?: number;
  purchaseRate?: number;
  fullFunnelRate?: number;
  counts?: {
    impressions: number;
    views: number;
    purchases: number;
  };
  rates?: {
    viewRate: number;
    purchaseRate: number;
    fullFunnelRate: number;
  };
};

export default function VendorFunnelChart({ funnel }: { funnel: VendorFunnel | Record<string, unknown> }) {
  if (!funnel) {
    return (
      <div className="neumorph-card p-4 text-center opacity-70 text-sm">
        Keine Funnel-Daten verfügbar.
      </div>
    );
  }

  // Helper to safely extract counts and rates from either structure
  const countsSource = ((): { impressions: number; views: number; purchases: number } => {
    if (typeof funnel === "object" && funnel !== null && "counts" in funnel) {
      const c = (funnel as { counts?: unknown }).counts;
      if (c && typeof c === "object") {
        return {
          impressions: Number((c as Record<string, unknown>).impressions ?? 0),
          views: Number((c as Record<string, unknown>).views ?? 0),
          purchases: Number((c as Record<string, unknown>).purchases ?? 0),
        };
      }
    }
    return {
      impressions: Number((funnel as { impressions?: unknown }).impressions ?? 0),
      views: Number((funnel as { views?: unknown }).views ?? 0),
      purchases: Number((funnel as { purchases?: unknown }).purchases ?? 0),
    };
  })();

  const ratesSource = ((): { viewRate: number; purchaseRate: number; fullFunnelRate: number } => {
    if (typeof funnel === "object" && funnel !== null && "rates" in funnel) {
      const r = (funnel as { rates?: unknown }).rates;
      if (r && typeof r === "object") {
        return {
          viewRate: Number((r as Record<string, unknown>).viewRate ?? 0),
          purchaseRate: Number((r as Record<string, unknown>).purchaseRate ?? 0),
          fullFunnelRate: Number((r as Record<string, unknown>).fullFunnelRate ?? 0),
        };
      }
    }
    return {
      viewRate: Number((funnel as { viewRate?: unknown }).viewRate ?? 0),
      purchaseRate: Number((funnel as { purchaseRate?: unknown }).purchaseRate ?? 0),
      fullFunnelRate: Number((funnel as { fullFunnelRate?: unknown }).fullFunnelRate ?? 0),
    };
  })();

  const impressions = countsSource.impressions;
  const views = countsSource.views;
  const purchases = countsSource.purchases;

  const viewRate = ratesSource.viewRate;
  const purchaseRate = ratesSource.purchaseRate;
  const fullFunnelRate = ratesSource.fullFunnelRate;

  const chartData = [
    { name: "Impressions", value: impressions },
    { name: "Views", value: views },
    { name: "Purchases", value: purchases },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neumorph-card p-4">
          <p className="text-xs opacity-70 mb-1">Ansichten-Rate</p>
          <p className="text-lg font-bold">
            {(viewRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="neumorph-card p-4">
          <p className="text-xs opacity-70 mb-1">Kauf-Rate (von Views)</p>
          <p className="text-lg font-bold">
            {(purchaseRate * 100).toFixed(1)}%
          </p>
        </div>
        <div className="neumorph-card p-4">
          <p className="text-xs opacity-70 mb-1">
            Full-Funnel (Impr → Kauf)
          </p>
          <p className="text-lg font-bold">
            {(fullFunnelRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-64 neumorph-inner">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
