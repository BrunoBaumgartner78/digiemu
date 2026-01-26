"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DownloadRow } from "@/lib/admin/downloads";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

type PieItem = { productId: string; productTitle: string; count: number };

export default function AdminDownloadsClient(props: {
  initial: {
    filters: { from?: string; to?: string; productId?: string; vendorId?: string; buyerId?: string };
    page: number;
    totalPages: number;
    total: number;
    rows: DownloadRow[];
    pie: PieItem[];
  };
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [from, setFrom] = useState(props.initial.filters.from ?? "");
  const [to, setTo] = useState(props.initial.filters.to ?? "");
  const [productId, setProductId] = useState(props.initial.filters.productId ?? "");
  const [vendorId, setVendorId] = useState(props.initial.filters.vendorId ?? "");
  const [buyerId, setBuyerId] = useState(props.initial.filters.buyerId ?? "");

  const rows = props.initial.rows;
  const pie = props.initial.pie;

  const qsBase = useMemo(() => {
    const q = new URLSearchParams(sp.toString());
    q.delete("page");
    return q;
  }, [sp]);

  function setOrDel(q: URLSearchParams, key: string, val: string) {
    const v = val?.trim();
    if (v) q.set(key, v);
    else q.delete(key);
  }

  function applyFilters() {
    const q = new URLSearchParams(qsBase.toString());
    setOrDel(q, "from", from);
    setOrDel(q, "to", to);
    setOrDel(q, "productId", productId);
    setOrDel(q, "vendorId", vendorId);
    setOrDel(q, "buyerId", buyerId);
    q.set("page", "1");
    router.push(`/admin/downloads?${q.toString()}`);
  }

  function goPage(p: number) {
    const q = new URLSearchParams(sp.toString());
    q.set("page", String(p));
    router.push(`/admin/downloads?${q.toString()}`);
  }

  async function exportCsv(mock: boolean) {
    const q = new URLSearchParams(sp.toString());
    const url = mock ? `/api/admin/downloads/mock?${q.toString()}` : `/api/admin/downloads/export?${q.toString()}`;
    window.location.href = url;
  }

  const inputCls =
    "rounded-xl px-3 py-2 text-sm border border-white/10 bg-white/5 outline-none focus:ring-2 focus:ring-white/10";
  const th = "text-left font-medium px-3 py-3";
  const td = "px-3 py-3 align-top";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full md:w-auto">
          <Field label="From">
            <input value={from} onChange={(e) => setFrom(e.target.value)} type="date" className={inputCls} />
          </Field>
          <Field label="To">
            <input value={to} onChange={(e) => setTo(e.target.value)} type="date" className={inputCls} />
          </Field>
          <Field label="ProductId">
            <input value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls} placeholder="prod_..." />
          </Field>
          <Field label="VendorId">
            <input value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls} placeholder="usr_..." />
          </Field>
          <Field label="BuyerId">
            <input value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className={inputCls} placeholder="usr_..." />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <Btn onClick={applyFilters}>Filter</Btn>
          <Btn onClick={() => exportCsv(false)}>Export CSV</Btn>
          <Btn onClick={() => exportCsv(true)}>Mock CSV</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-medium">Downloads (filtered)</div>
          <div className="text-2xl font-semibold mt-1">{props.initial.total}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Page {props.initial.page} / {props.initial.totalPages}</div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-medium mb-2">Pie pro Produkt (aktuelle Seite)</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="count" data={pie} nameKey="productTitle" outerRadius={80} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">(Wenn du “global” statt “current page” willst: Pie aus Server Query via groupBy bauen.)</div>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-[var(--text-muted)]">
            <tr className="border-b border-white/10">
              <th className={th}>Date</th>
              <th className={th}>Product</th>
              <th className={th}>Buyer</th>
              <th className={th}>Vendor</th>
              <th className={th}>IDs</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-4 text-[var(--text-muted)]" colSpan={5}>Keine Einträge für diese Filter.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-white/10 last:border-b-0">
                  <td className={td}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td className={td}><div className="font-medium">{r.productTitle}</div><div className="text-xs text-[var(--text-muted)]">{r.productId}</div></td>
                  <td className={td}><div className="font-medium">{r.buyerEmail ?? "—"}</div><div className="text-xs text-[var(--text-muted)]">{r.buyerId ?? ""}</div></td>
                  <td className={td}><div className="font-medium">{r.vendorEmail ?? "—"}</div><div className="text-xs text-[var(--text-muted)]">{r.vendorId ?? ""}</div></td>
                  <td className={td}><div className="text-xs text-[var(--text-muted)]">{r.id}</div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-muted)]">Total: {props.initial.total} • Page {props.initial.page}/{props.initial.totalPages}</div>
        <div className="flex gap-2">
          <Btn disabled={props.initial.page <= 1} onClick={() => goPage(props.initial.page - 1)}>Prev</Btn>
          <Btn disabled={props.initial.page >= props.initial.totalPages} onClick={() => goPage(props.initial.page + 1)}>Next</Btn>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs text-[var(--text-muted)] flex flex-col gap-1">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "rounded-xl px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-white/5 transition shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] " +
        className
      }
    />
  );
}
