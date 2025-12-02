"use client";
import { PieChart, Pie, Tooltip, Cell } from "recharts";
import { SaleEntry } from "@/types/sales";

interface Props {
  sales: SaleEntry[];
}

export default function ProductDownloadPie({ sales }: Props) {
  const grouped = sales.reduce((acc, s) => {
    const key = s.product.title;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(grouped).map(([name, value]) => ({
    name,
    value,
  }));

  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="neo-card p-5 mb-8">
      <h2 className="font-semibold mb-3">Downloads pro Produkt</h2>

      <PieChart width={350} height={280}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          label
          outerRadius={115}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}
