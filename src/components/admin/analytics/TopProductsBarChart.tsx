"use client";
import React from "react";
import { isNumber } from "../../../lib/guards";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export type TopProductsBarChartData = {
  productTitle: string;
  totalRevenueCents: number;
  totalCount: number;
};

interface Props {
  data: TopProductsBarChartData[];
}

function formatCHF(cents: number) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(cents / 100);
}

export default function TopProductsBarChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          dataKey="productTitle"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-20}
          dy={10}
        />
        <YAxis tickFormatter={v => formatCHF(v * 100)} tick={{ fontSize: 12 }} width={70} />
        <Tooltip
          formatter={(value: unknown, name: string) => {
            if (name === "totalRevenueCents" && isNumber(value)) return formatCHF(value);
            return String(value ?? "");
          }}
          labelFormatter={label => `Produkt: ${label}`}
          contentStyle={{ fontSize: 14 }}
        />
        <Legend verticalAlign="top" height={36} />
        <Bar
          dataKey="totalRevenueCents"
          name="Umsatz (CHF)"
          fill="#4a7cff"
          unit=""
        />
        <Bar
          dataKey="totalCount"
          name="Verkäufe"
          fill="#8884d8"
          unit=""
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
