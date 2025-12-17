// src/app/dashboard/vendor/VendorPayoutTable.tsx
"use client";

import React from "react";
import type { VendorPayoutRow } from "../vendor/types";

function formatDateISO(iso?: string | Date | null) {
  if (!iso) return "";
  try {
    const d = iso instanceof Date ? iso : new Date(String(iso));
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("de-CH");
  } catch {
    return String(iso);
  }
}

export default function VendorPayoutTable({
  payouts,
}: {
  payouts: VendorPayoutRow[];
}) {
  return (
    <div className="neo-surface rounded-3xl p-6 md:p-8 mt-8">
      <h2 className="text-lg md:text-xl font-semibold mb-4 text-[var(--color-text-primary)]">
        Auszahlungsstatus
      </h2>

      <div className="mb-3 text-xs text-[var(--color-text-muted)]">
        Auszahlungen erfolgen aktuell manuell durch DigiEmu.
      </div>

      {payouts.length === 0 ? (
        <div className="text-sm text-[var(--color-text-muted)]">
          Noch keine Auszahlungen erfolgt.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[520px]">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Betrag (CHF)</th>
                <th>Status</th>
                <th>Bezahlt am</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{formatDateISO(p.createdAt)}</td>
                  <td>{(p.amountCents / 100).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.status === "PAID" ? "badge-green" : "badge-gray"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>{p.paidAt ? formatDateISO(p.paidAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
