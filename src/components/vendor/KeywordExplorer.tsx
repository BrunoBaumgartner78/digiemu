"use client";

import { useEffect, useState } from "react";

type KeywordEntry = {
  keyword: string;
  count: number;
  productCount: number;
};

export default function KeywordExplorer() {
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/vendor/keywords");
      const json = await res.json();
      setKeywords(json.keywords || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="neumorph-card p-4 text-sm opacity-70">Daten werden geladen…</div>;
  }

  if (!keywords.length) {
    return (
      <div className="neumorph-card p-4 text-sm opacity-70">
        Noch keine Keyword-Daten verfügbar. Lege Produkte mit Titeln und Beschreibungen an.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="neumorph-card p-4 text-xs opacity-70 mb-2">
        Diese Begriffe kommen häufig in deinen Produkt-Titeln und Beschreibungen vor. Nutze relevante Keywords für bessere Sichtbarkeit.
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span
            key={k.keyword}
            className="px-3 py-1 rounded-full text-xs neumorph-card"
          >
            {k.keyword}{" "}
            <span className="opacity-60">
              ({k.count}× · {k.productCount} Produkte)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
