"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import { useEffect, useState } from "react";

import FunnelChart from "@/components/vendor/FunnelChart";
import AIOptimizationPanel from "@/components/vendor/AIOptimizationPanel";

interface ProductDrilldownModalProps {
  productId: string;
  onClose: () => void;
}

export default function ProductDrilldownModal({ productId, onClose }: ProductDrilldownModalProps) {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState("30");
  const [funnel, setFunnel] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("stats");

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/vendor/product/${productId}/details?range=${range}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setData(json);
    }
    load();

    async function loadFunnel() {
      const res = await fetch(
        `/api/vendor/product/${productId}/funnel?range=${range}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setFunnel(json.funnel);
    }
    loadFunnel();
  }, [productId, range]);

  if (!data) return null;

  const { product, kpis, chartData } = data;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="neumorph-card w-full max-w-3xl p-6 relative">
        {/* Close */}
        <button
          className="absolute top-3 right-3 px-3 py-1 rounded-lg opacity-60 hover:opacity-100"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">{product.title}</h2>
        <p className="text-sm opacity-70 mb-4">Produkt-Analyse</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-3 py-1 rounded-lg text-sm neumorph-card ${activeTab === "stats" ? "opacity-100 font-semibold" : "opacity-60"}`}
            onClick={() => setActiveTab("stats")}
          >
            Statistiken
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm neumorph-card ${activeTab === "ai" ? "opacity-100 font-semibold" : "opacity-60"}`}
            onClick={() => setActiveTab("ai")}
          >
            AI Insights
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "stats" && (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {["7", "30", "90", "all"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-sm neumorph-card ${
                    range === r ? "opacity-100 font-semibold" : "opacity-60"
                  }`}
                >
                  {r === "7" ? "7 Tage" :
                   r === "30" ? "30 Tage" :
                   r === "90" ? "90 Tage" : "Alle"}
                </button>
              ))}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="neumorph-card p-3 text-center">
                <p className="text-xs opacity-70">Views</p>
                <p className="text-lg font-bold">{kpis.views}</p>
              </div>

              <div className="neumorph-card p-3 text-center">
                <p className="text-xs opacity-70">Sales</p>
                <p className="text-lg font-bold">{kpis.sales}</p>
              </div>

              <div className="neumorph-card p-3 text-center">
                <p className="text-xs opacity-70">CTR</p>
                <p className="text-lg font-bold">
                  {(kpis.ctr * 100).toFixed(1)}%
                </p>
              </div>

              <div className="neumorph-card p-3 text-center">
                <p className="text-xs opacity-70">Umsatz</p>
                <p className="text-lg font-bold">
                  CHF {(kpis.revenueCents / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full h-64 mb-6">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter={(v) => `CHF ${(v / 100).toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(v, key) => {
                      const num = typeof v === "number" ? v : Number(v);
                      if (key === "ctr") return `${(num * 100).toFixed(2)}%`;
                      if (key === "earningsCents") return `CHF ${(num / 100).toFixed(2)}`;
                      return v;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="earningsCents"
                    stroke="#ffb100"
                    strokeWidth={3}
                    dot={false}
                    name="Umsatz"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Funnel */}
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Conversion Funnel</h3>
              {funnel ? (
                <FunnelChart data={funnel} />
              ) : (
                <p className="opacity-70 text-sm">Funnel wird geladen…</p>
              )}
            </div>
          </>
        )}

        {activeTab === "ai" && (
          <AIOptimizationPanel productId={productId} />
        )}

      </div>
    </div>
  );
}

