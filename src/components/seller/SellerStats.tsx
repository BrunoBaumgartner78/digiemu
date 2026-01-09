import React from "react";

type Props = { vendorProfile?: any };

function humanDate(d?: string | Date | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("de-CH", { year: "numeric", month: "short", day: "numeric" }).format(dt);
  } catch {
    return dt.toISOString().slice(0, 10);
  }
}

export default function SellerStats({ vendorProfile }: Props) {
  const totalSales = typeof vendorProfile?.totalSales === "number" ? vendorProfile.totalSales : 0;
  const activeProducts = typeof vendorProfile?.activeProductsCount === "number" ? vendorProfile.activeProductsCount : 0;
  const lastSale = vendorProfile?.lastSaleAt ?? null;
  const revenueCents = typeof vendorProfile?.totalRevenueCents === "number" ? vendorProfile.totalRevenueCents : 0;

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{totalSales}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Verkäufe</div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{activeProducts}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Aktive Produkte</div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{humanDate(lastSale)}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Letzter Verkauf</div>
      </div>

      {revenueCents > 0 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(revenueCents / 100)}</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Umsatz</div>
        </div>
      )}
    </div>
  );
}
