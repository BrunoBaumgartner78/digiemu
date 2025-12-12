// src/components/vendor/LowPerformanceList.tsx
"use client";

import { useEffect, useState } from "react";

type LowPerfProduct = {
  id: string;
  title: string;
  views: number;
  sales: number;
  conversionRate: number;
};

export default function LowPerformanceList() {
  const [items, setItems] = useState<LowPerfProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/vendor/products/low-performance");
        if (!res.ok) {
          throw new Error(`Fehler beim Laden: ${res.status}`);
        }

        const text = await res.text();

        // ❗ Wenn der Body leer ist → einfach leere Liste anzeigen
        if (!text) {
          if (!cancelled) {
            setItems([]);
          }
          return;
        }

        let json: any;
        try {
          json = JSON.parse(text);
        } catch (e) {
          console.error("LowPerformanceList: JSON parse error", e, text);
          if (!cancelled) {
            setItems([]);
          }
          return;
        }

        if (!cancelled) {
          setItems(json.products || []);
        }
      } catch (e: any) {
        console.error("LowPerformanceList: fetch error", e);
        if (!cancelled) {
          setError(e.message ?? "Unbekannter Fehler");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-sm opacity-70 py-4">
        Lade Low-Performance-Produkte…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-4">
        {error}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-sm opacity-70 py-4">
        Aktuell keine Low-Performance-Produkte gefunden.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {items.map((p) => (
        <div
          key={p.id}
          className="flex justify-between items-center py-2 border-b last:border-none border-black/5"
        >
          <div>
            <div className="font-semibold">{p.title}</div>
            <div className="text-xs opacity-70">
              Views: {p.views} · Sales: {p.sales} · Conv.:{" "}
              {(p.conversionRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
