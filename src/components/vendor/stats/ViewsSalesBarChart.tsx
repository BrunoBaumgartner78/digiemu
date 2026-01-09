"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export type CompareData = {
  productTitle: string;
  views: number;
  sales: number;
};

export default function ViewsSalesBarChart({ data }: { data: CompareData[] }) {
  if (!data || data.length === 0) {
    return <div className="neumorph-card p-8 text-center text-muted">Noch keine Vergleichsdaten vorhanden.</div>;
  }
  const sorted = [...data].sort((a, b) => b.sales - a.sales);
  return (
    <div className="neumorph-card p-4 md:p-6" style={{ overflow: "hidden" }}>
      <h2 className="font-semibold text-lg mb-4">Views vs. Käufe</h2>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="productTitle" tick={{ fontSize: 12 }} interval={0} angle={-20} dy={10} />
          <YAxis tick={{ fontSize: 12 }} width={60} />
          <Tooltip labelFormatter={label => `Produkt: ${label}`} contentStyle={{ fontSize: 14 }} />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="views" name="Views" fill="#8884d8" />
          <Bar dataKey="sales" name="Käufe" fill="#4a7cff" />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
