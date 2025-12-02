"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { SaleEntry } from "@/types/sales";

interface Props {
  sales: SaleEntry[];
}

export default function RevenueChart({ sales }: Props) {
  const data = sales.map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString("de-CH"),
    value: s.amountCents / 100,
  }));

  return (
    <div className="rounded-xl p-5 bg-white shadow border mb-8">
      <h2 className="font-semibold mb-3">Umsatz</h2>

      <LineChart width={600} height={250} data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2563eb"
          strokeWidth={2}
        />
      </LineChart>
    </div>
  );
}
