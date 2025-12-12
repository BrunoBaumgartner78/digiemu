"use client";
import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export type RevenueData = {
  date: string;
  revenueCents: number;
};

function formatCHF(cents: number) {
  return (cents / 100).toFixed(2) + " CHF";
}

export default function RevenueOverTimeChart({ data }: { data: RevenueData[] }) {
  if (!data || data.length === 0) {
    return <div className="neumorph-card p-8 text-center text-muted">Noch keine Umsatzdaten vorhanden.</div>;
  }
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="neumorph-card p-4 md:p-6">
      <h2 className="font-semibold text-lg mb-4">Umsatzverlauf</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={sorted} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-20} dy={10} />
          <YAxis tickFormatter={v => formatCHF(v)} tick={{ fontSize: 12 }} width={70} />
          <Tooltip formatter={v => formatCHF(Number(v))} labelFormatter={label => `Datum: ${label}`} contentStyle={{ fontSize: 14 }} />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="revenueCents" name="Umsatz (CHF)" stroke="#4a7cff" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
