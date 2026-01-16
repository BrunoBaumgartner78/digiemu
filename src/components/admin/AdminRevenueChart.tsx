"use client";
import React from "react";
import { isNumber } from "../../lib/guards";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/**
 * Props:
 * - data: Array<{ date: string; amount: number }>
 *   Datum (YYYY-MM-DD) und Tagesumsatz in CHF
 */
export type AdminRevenueChartProps = {
  data: { date: string; amount: number }[];
};

export default function AdminRevenueChart({ data }: AdminRevenueChartProps) {
  return (
    <div className="neo-card" style={{ background: "transparent", padding: 24 }}>
      <h3 style={{ color: "var(--text-main)", marginBottom: 12 }}>Umsatzverlauf (letzte 30 Tage)</h3>
      {data.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>
          Noch keine Daten vorhanden
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e0e0e0)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              tick={{ fontSize: 12 }}
              minTickGap={12 }
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `${v} CHF`}
            />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #eee", color: "#222" }}
              labelStyle={{ color: "#888" }}
              formatter={(value: unknown) => (isNumber(value) ? `${value.toFixed(2)} CHF` : String(value ?? ""))}
              labelFormatter={(label) => `Datum: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#4f8cff"
              strokeWidth={2}
              dot={{ r: 3, stroke: "#4f8cff", fill: "#fff" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
