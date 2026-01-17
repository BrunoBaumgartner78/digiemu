"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { EarningsDTO } from "@/types/ui";

type EarningsPoint = { date: string; earningsCents: number };

interface EarningsChartProps {
  data: EarningsPoint[] | EarningsDTO;
}

export default function EarningsChart({ data }: EarningsChartProps) {
  const points: EarningsPoint[] = Array.isArray(data) ? data : data?.points ?? [];
  if (points.length === 0) {
    return (
      <div className="text-center py-6 opacity-70">
        Keine Daten für diesen Zeitraum.
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer>
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `CHF ${(v / 100).toFixed(0)}`}
            width={70}
          />
          <Tooltip
            formatter={(v) => typeof v === "number" ? `CHF ${(v / 100).toFixed(2)}` : v}
            labelFormatter={(l) => `Datum: ${l}`}
          />
          <Line type="monotone" dataKey="earningsCents" stroke="#ffb100" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
