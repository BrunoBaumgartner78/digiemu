"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Row = { date: string; value: number };

export default function Revenue30dChart() {
  const [data, setData] = React.useState<Row[]>([]);
  const [max, setMax] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setError(null);
        const res = await fetch("/api/analytics/revenue-30d", { cache: "no-store" });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt.slice(0, 120)}`);
        }

        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error ?? "API error");

        setData(json.data ?? []);
        setMax(Number(json.max ?? 0));
      } catch (e: any) {
        setError(e?.message ?? "Chart Fehler");
      }
    })();
  }, []);

  const axisColor = "rgba(255,255,255,0.75)";
  const gridColor = "rgba(255,255,255,0.10)";

  return (
    <div style={{ width: "100%", height: 240 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ color: "white" }}>Einnahmen – letzte 30 Tage</strong>
        <span style={{ opacity: 0.85, color: "white" }}>
          Max Tagesumsatz: CHF {max.toFixed(2)}
        </span>
      </div>

      {error ? (
        <div style={{ color: "rgba(255,255,255,0.85)" }}>✕ {error}</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => String(d).slice(5)} // MM-DD
              interval={4}
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={{ stroke: axisColor }}
              tickLine={{ stroke: axisColor }}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={{ stroke: axisColor }}
              tickLine={{ stroke: axisColor }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(8, 15, 30, 0.92)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "white",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.85)" }}
              itemStyle={{ color: "white" }}
              formatter={(v: any) => [`CHF ${Number(v).toFixed(2)}`, "Umsatz"]}
            />
            {/* Bars: hell (ohne hardcode Farbe geht’s auch via CSS, aber so ist’s stabil) */}
            <Bar dataKey="value" fill="rgba(255,255,255,0.9)" radius={[999, 999, 999, 999]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
        Anzeige: Tagesumsatz (30 Balken). Datenquelle: bezahlte Orders der letzten 30 Tage.
      </div>
    </div>
  );
}
