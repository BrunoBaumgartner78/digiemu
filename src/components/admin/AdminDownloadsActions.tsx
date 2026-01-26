"use client";

import React from "react";

function formatDateYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminDownloadsActions() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function downloadCsv(url: string, filename: string) {
    const res = await fetch(url, { method: "GET", headers: { Accept: "text/csv" } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Export failed (${res.status})`);
    }
    const blob = await res.blob();
    const objUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objUrl);
  }

  async function onExport(mock = false) {
    setLoading(true);
    setError(null);
    try {
      const url = mock ? "/api/admin/downloads/export?mock=true" : "/api/admin/downloads/export";
      const name = mock
        ? "downloads_mock.csv"
        : `downloads_${formatDateYYYYMMDD(new Date())}.csv`;
      await downloadCsv(url, name);
    } catch (e: any) {
      setError(e?.message ?? "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onExport(false)}
        disabled={loading}
        className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
      >
        {loading ? "Exporting..." : "Export CSV"}
      </button>

      <button
        type="button"
        onClick={() => onExport(true)}
        disabled={loading}
        className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
        title="Dev-Test: exportiert Mock CSV ohne DB"
      >
        Mock CSV
      </button>

      {error ? (
        <span className="text-xs text-red-500 max-w-[420px] truncate" title={error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
