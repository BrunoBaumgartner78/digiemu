"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PayoutFilters, serializePayoutFilters } from "@/lib/payout-filters";

type VendorOption = { id: string; email: string; vendorProfile?: { displayName?: string | null } | null };

export default function AdminPayoutFilters({
  vendors,
  initialFilters,
}: {
  vendors: VendorOption[];
  initialFilters: PayoutFilters;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialFilters.status ?? "");
  const [vendorId, setVendorId] = useState(initialFilters.vendorId ?? "");
  const [from, setFrom] = useState(initialFilters.dateFrom ?? "");
  const [to, setTo] = useState(initialFilters.dateTo ?? "");

  function applyFilters() {
    const qs = serializePayoutFilters({ status: status || undefined, vendorId: vendorId || undefined, dateFrom: from || undefined, dateTo: to || undefined, page: 1 });
    router.push(`/admin/payouts?${qs}`);
  }

  function resetFilters() {
    router.push(`/admin/payouts`);
  }

  const exportQuery = serializePayoutFilters({ status: status || undefined, vendorId: vendorId || undefined, dateFrom: from || undefined, dateTo: to || undefined });

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div>
        <label className="text-xs">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-neu">
          <option value="">Alle</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <div>
        <label className="text-xs">Vendor</label>
        <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="input-neu w-56">
          <option value="">Alle Vendoren</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.vendorProfile?.displayName ?? v.email}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs">Von</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-neu" />
      </div>

      <div>
        <label className="text-xs">Bis</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-neu" />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={applyFilters} className="neobtn-sm">Anwenden</button>
        <button type="button" onClick={resetFilters} className="neobtn-sm ghost">Zurücksetzen</button>
      </div>

      <div className="ml-auto">
        <a href={`/api/admin/payouts/export?${exportQuery}`} className="neobtn-sm">Export CSV</a>
      </div>
    </div>
  );
}
