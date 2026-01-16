"use client";
import React from "react";
import { isNumber } from "../../../lib/guards";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
} from "recharts";

export type RevenueOverTimeChartData = {
  date: string; // e.g. '2025-12-06'
  revenueCents: number;
  orders: number;
};

interface Props {
  data: RevenueOverTimeChartData[];
}

function formatCHF(cents: number) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(cents / 100);
}

export default function RevenueOverTimeChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={sorted} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4a7cff" stopOpacity={0.7}/>
            <stop offset="95%" stopColor="#4a7cff" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-20} dy={10} />
        <YAxis tickFormatter={v => formatCHF(v * 100)} tick={{ fontSize: 12 }} width={70} />
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <Tooltip
          formatter={(value: unknown, name: string) => {
            if (name === "revenueCents" && isNumber(value)) return formatCHF(value);
            return String(value ?? "");
          }}
          labelFormatter={label => `Datum: ${label}`}
          contentStyle={{ fontSize: 14 }}
        />
        <Legend verticalAlign="top" height={36} />
        <Area
          type="monotone"
          dataKey="revenueCents"
          name="Umsatz (CHF)"
          stroke="#4a7cff"
          fillOpacity={1}
          fill="url(#colorRevenue)"
          unit=""
        />
        <Line
          type="monotone"
          dataKey="orders"
          name="Bestellungen"
          stroke="#8884d8"
          strokeDasharray="5 2"
          dot={false}
          yAxisId={1}
        />
        <YAxis
          yAxisId={1}
          orientation="right"
          tick={{ fontSize: 12 }}
          width={40}
          axisLine={false}
          tickLine={false}
          label={{ value: "Bestellungen", angle: 90, position: "insideRight", fontSize: 10 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
