"use client";

import { useState, useEffect } from "react";

interface AIOptimizationPanelProps {
  productId: string;
}

interface AIAnalysis {
  seo_score: number;
  seo_issues: string[];
  seo_suggestions: string[];
  pricing_score: number;
  pricing_suggestions: string[];
  conversion_score: number;
  conversion_suggestions: string[];
  keyword_list: string[];
  summary: string;
}

export default function AIOptimizationPanel({ productId }: AIOptimizationPanelProps) {
  const [data, setData] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/vendor/product/${productId}/optimize`);
      const json = await res.json();
      setData(json.analysis || null);
      setLoading(false);
    }
    load();
  }, [productId]);

  if (loading)
    return <p className="opacity-70 text-sm">AI-Analyse wird geladen…</p>;

  if (!data)
    return <p className="opacity-70 text-sm">Keine Daten verfügbar.</p>;

  return (
    <div className="space-y-4">
      <div className="neumorph-card p-4">
        <h3 className="font-semibold mb-2">AI-Zusammenfassung</h3>
        <p className="text-sm opacity-80">{data?.summary}</p>
      </div>

      <div className="neumorph-card p-4">
        <h4 className="font-semibold">SEO</h4>
        <p className="text-xs">Score: {data?.seo_score}/100</p>
        <ul className="list-disc ml-4 text-xs opacity-70">
          {data?.seo_suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="neumorph-card p-4">
        <h4 className="font-semibold">Preisgestaltung</h4>
        <p className="text-xs">Score: {data?.pricing_score}/100</p>
        <ul className="list-disc ml-4 text-xs opacity-70">
          {data?.pricing_suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="neumorph-card p-4">
        <h4 className="font-semibold">Conversion</h4>
        <p className="text-xs">Score: {data?.conversion_score}/100</p>
        <ul className="list-disc ml-4 text-xs opacity-70">
          {data?.conversion_suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      <div className="neumorph-card p-4">
        <h4 className="font-semibold">Keyword-Vorschläge</h4>
        <div className="flex flex-wrap gap-2">
          {data?.keyword_list?.map((k: string, i: number) => (
            <span
              key={i}
              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
