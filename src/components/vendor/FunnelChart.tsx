"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function FunnelChart({ data }) {
  const funnelData = [
    { name: "Impressionen", value: data.impressions },
    { name: "Ansichten", value: data.views },
    { name: "In Warenkorb", value: data.atc },
    { name: "Käufe", value: data.purchases }
  ];

  const colors = ["#b0c4de", "#87bfff", "#5aa9ff", "#0077ff"];

  return (
    <div className="space-y-2">
      <div className="text-xs opacity-70 mb-1">
        Der Funnel zeigt, wie viele Nutzer dein Produkt gesehen (Impressionen), angeklickt (Ansichten), in den Warenkorb gelegt und gekauft haben.
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer>
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
          >
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip />
            <Bar dataKey="value">
              {funnelData.map((entry, index) => (
                <Cell key={index} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
