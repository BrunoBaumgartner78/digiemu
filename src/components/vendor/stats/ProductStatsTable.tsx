"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from "next/link";

export type ProductStat = {
  productId: string;
  title: string;
  sales: number;
  revenueCents: number;
  views: number;
  conversionRate: number;
};

function formatCHF(cents: number) {
  return (cents / 100).toFixed(2) + " CHF";
}

const columns = [
  { key: "title", label: "Produkt" },
  { key: "sales", label: "Käufe" },
  { key: "revenueCents", label: "Umsatz" },
  { key: "views", label: "Views" },
  { key: "conversionRate", label: "Conversion %" },
];

export default function ProductStatsTable({ stats }: { stats: ProductStat[] }) {
  const [sortKey, setSortKey] = useState<string>("revenueCents");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  if (!stats || stats.length === 0) {
    return (
      <div className="neumorph-card p-8 text-center text-muted">
        Noch keine Produkt-Statistiken vorhanden.
      </div>
    );
  }

  const sorted = [...stats].sort((a, b) => {
    const vA = a[sortKey as keyof ProductStat];
    const vB = b[sortKey as keyof ProductStat];
    if (typeof vA === "number" && typeof vB === "number") {
      return sortDir === "asc" ? vA - vB : vB - vA;
    }
    return String(vA).localeCompare(String(vB));
  });

  const topId = sorted[0]?.productId;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm neumorph-card">
        <thead>
          <tr className="text-left text-muted">
            {columns.map(col => (
              <th
                key={col.key}
                className="py-2 pr-4 cursor-pointer select-none"
                onClick={() => {
                  if (sortKey === col.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                  else { setSortKey(col.key); setSortDir("desc"); }
                }}
              >
                {col.label}
                {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(stat => (
            <tr
              key={stat.productId}
              className={`border-b last:border-0 ${stat.productId === topId ? "bg-accent-soft" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/dashboard/products/${stat.productId}`)}
            >
              <td className="py-2 pr-4 font-semibold">{stat.title}</td>
              <td className="py-2 pr-4">{stat.sales}</td>
              <td className="py-2 pr-4">{formatCHF(stat.revenueCents)}</td>
              <td className="py-2 pr-4">{stat.views}</td>
              <td className="py-2 pr-4">{stat.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
