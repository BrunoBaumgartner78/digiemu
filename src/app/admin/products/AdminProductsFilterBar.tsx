"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminProductsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = React.useState(sp.get("q") ?? "");
  const [vendorId, setVendorId] = React.useState(sp.get("vendorId") ?? "");
  const [status, setStatus] = React.useState(sp.get("status") ?? "");

  function apply() {
    const params = new URLSearchParams(sp.toString());
    q.trim() ? params.set("q", q.trim()) : params.delete("q");
    vendorId.trim() ? params.set("vendorId", vendorId.trim()) : params.delete("vendorId");
    status.trim() ? params.set("status", status.trim()) : params.delete("status");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh(); // extra sicher
  }

  function reset() {
    router.push(pathname);
    router.refresh();
  }

  return (
    <div className="neo-card p-3 flex gap-2 flex-wrap">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suche..." />
      <input value={vendorId} onChange={(e) => setVendorId(e.target.value)} placeholder="VendorId" />
      <input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status (optional)" />
      <button className="neo-btn" onClick={apply}>Filter</button>
      <button className="neo-btn" onClick={reset}>Reset</button>
    </div>
  );
}
