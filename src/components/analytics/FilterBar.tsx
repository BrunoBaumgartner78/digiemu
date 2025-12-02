"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("range") ?? "all";

  const ranges = [
    { key: "today", label: "Heute" },
    { key: "7days", label: "7 Tage" },
    { key: "30days", label: "30 Tage" },
    { key: "all", label: "Gesamt" },
  ];

  function setRange(key: string) {
    router.push(`?range=${key}`);
  }

  return (
    <div className="flex gap-2 mb-6">
      {ranges.map((r) => (
        <button
          key={r.key}
          onClick={() => setRange(r.key)}
          className={`px-3 py-2 rounded-lg text-sm shadow
            ${active === r.key
              ? "bg-blue-600 text-white"
              : "bg-white border"}
          `}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
