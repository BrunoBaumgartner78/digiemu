"use client";
import { useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Product = {
  title: string;
  views30: number;
  sales30: number;
  conversionRate?: number;
  revenueCents?: number;
  dailyStats?: { date: string; views: number; sales: number }[];
  // dynamic fields can be kept as a safe record if needed
  extras?: Record<string, unknown>;
};

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
}

export default function ProductDetailModal({ open, onClose, product }: ProductDetailModalProps) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  if (!open || !product) return null;

  const data = product.dailyStats || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div className="neumorph-card p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm opacity-60 hover:opacity-100"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold mb-2">{product.title}</h2>
        <p className="text-sm opacity-75 mb-4">
          Detailanalyse der letzten 30 Tage
        </p>

        <div className="flex gap-4 flex-wrap mb-6">
          <div className="neumorph-card p-3 text-center flex-1">
            <div className="text-xs opacity-60">Views</div>
            <div className="text-lg font-semibold">{product.views30}</div>
          </div>

          <div className="neumorph-card p-3 text-center flex-1">
            <div className="text-xs opacity-60">Verkäufe</div>
            <div className="text-lg font-semibold">{product.sales30}</div>
          </div>

          <div className="neumorph-card p-3 text-center flex-1">
            <div className="text-xs opacity-60">Conversion</div>
            <div className="text-lg font-semibold">
              {((product.conversionRate ?? 0) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="neumorph-card p-3 text-center flex-1">
            <div className="text-xs opacity-60">Umsatz</div>
            <div className="text-lg font-semibold">
              CHF {((product.revenueCents ?? 0) / 100).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="h-64 neumorph-card p-4">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="var(--accent)" strokeWidth={2} />
                <Line type="monotone" dataKey="sales" stroke="#888" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="opacity-60 text-sm text-center mt-20">
              Keine Aktivität in diesem Zeitraum.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}