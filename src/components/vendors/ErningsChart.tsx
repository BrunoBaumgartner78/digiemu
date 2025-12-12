"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

export default function EarningsChart({ daily, topProducts }) {
  return (
    <div className="space-y-10">
      {/* Umsatzverlauf */}
      <div className="neumorph-card p-6">
        <h2 className="text-xl font-semibold mb-4">Umsatzverlauf</h2>

        {daily.length === 0 ? (
          <p className="opacity-60">Noch keine Umsätze vorhanden.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#4a90e2"
                  fill="#4a90e255"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top-Produkte */}
      <div className="neumorph-card p-6">
        <h2 className="text-xl font-semibold mb-4">Top Produkte</h2>

        {topProducts.length === 0 ? (
          <p className="opacity-60">Noch keine Verkäufe.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="earnings" fill="#55aa55" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
