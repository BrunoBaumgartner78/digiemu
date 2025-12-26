"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { parseISO, format } from "date-fns";

type EarningsChartData = {
  date: string; // YYYY-MM-DD
  earningsCents: number;
  [key: string]: any;
};

interface EarningsChartProps {
  data: EarningsChartData[];
}

export default function EarningsChart({ data }: EarningsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 opacity-70">Keine Daten für diesen Zeitraum.</div>
    );
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-2">Tägliche Einnahmen (letzte 30 Tage)</div>
      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(d) => {
                try {
                  return format(parseISO(d), "dd.MM");
                } catch (e) {
                  return d;
                }
              }}
            />
            <YAxis
              tickFormatter={(v) => `CHF ${(v / 100).toFixed(0)}`}
              width={80}
            />
            <Tooltip
              formatter={(v: any) => (typeof v === "number" ? `CHF ${(v / 100).toFixed(2)}` : v)}
              labelFormatter={(l) => {
                try {
                  return format(parseISO(String(l)), "dd.MM.yyyy");
                } catch (e) {
                  return String(l);
                }
              }}
            />
            <Bar dataKey="earningsCents" fill="#ffb100" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
