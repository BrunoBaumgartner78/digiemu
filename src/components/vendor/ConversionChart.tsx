"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

type ConversionChartData = {
  date: string;
  value?: number;
  conversion?: number;
  [key: string]: any;
};

interface ConversionChartProps {
  data: ConversionChartData[];
}

export default function ConversionChart({ data }: ConversionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 opacity-70">
        Keine Daten für diesen Zeitraum.
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis dataKey="date" tick={{ fontSize: 12 }} />

          <YAxis
            yAxisId="left"
            tickFormatter={(v) => v}
            width={40}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            width={50}
          />

          <Tooltip
            formatter={(val, key) => {
              if (key === "ctr" && typeof val === "number") return `${(val * 100).toFixed(2)}%`;
              return val;
            }}
            labelFormatter={(l) => `Datum: ${l}`}
          />

          <Legend />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="views"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            name="Views"
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="sales"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
            name="Sales"
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ctr"
            stroke="#ffb100"
            strokeWidth={3}
            dot={false}
            name="CTR"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
