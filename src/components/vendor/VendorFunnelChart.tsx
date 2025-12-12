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

export default function VendorFunnelChart({ funnel }: { funnel: VendorFunnel }) {
  if (!funnel) {
    return (
      <div className="neumorph-card p-4 text-center opacity-70 text-sm">
        Keine Funnel-Daten verfügbar.
      </div>
    );
  }

  // 🔹 Counts: unterstützt alte (counts.*) und neue (direkt auf funnel) Struktur
  const counts = (funnel as any).counts ?? funnel;

  const impressions = counts?.impressions ?? 0;
  const views = counts?.views ?? 0;
  const purchases = counts?.purchases ?? 0;

  // 🔹 Rates: unterstützt alte (rates.*) und neue (direkt auf funnel) Struktur
  const rates = (funnel as any).rates ?? funnel;

  const viewRate = rates?.viewRate ?? 0;
  const purchaseRate = rates?.purchaseRate ?? 0;
  const fullFunnelRate = rates?.fullFunnelRate ?? 0;

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
