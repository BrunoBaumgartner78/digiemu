import { requireAdminPage } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCHF } from "@/lib/format";

export const metadata = {
  title: "Vendor Earnings Übersicht – DigiEmu",
  description: "Admin-Übersicht aller Vendor-Einnahmen.",
};

export default async function AdminVendorEarningsPage() {
  const session = await requireAdminPage();
  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
          <p className="mb-4">Nur Admins dürfen diese Seite sehen.</p>
          <Link href="/" className="neobtn">Zur Startseite</Link>
        </div>
      </main>
    );
  }

  // Alle Orders mit Produkt und Vendor laden
  const orders = await prisma.order.findMany({
    include: {
      product: { include: { vendor: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Gruppieren nach vendorId
  const vendorMap = new Map<string, {
    vendorName: string;
    vendorEmail: string;
    totalOrders: number;
    totalRevenueCents: number;
    vendorEarningsCents: number;
    platformEarningsCents: number;
  }>();

  for (const order of orders) {
    const vendor = order.product?.vendor;
    if (!vendor) continue;
    const key = vendor.id;
    if (!vendorMap.has(key)) {
      vendorMap.set(key, {
        vendorName: vendor.name || vendor.email || key,
        vendorEmail: vendor.email || "-",
        totalOrders: 0,
        totalRevenueCents: 0,
        vendorEarningsCents: 0,
        platformEarningsCents: 0,
      });
    }
    const entry = vendorMap.get(key)!;
    entry.totalOrders += 1;
    entry.totalRevenueCents += order.amountCents;
    entry.vendorEarningsCents += order.vendorEarningsCents;
    entry.platformEarningsCents += order.platformEarningsCents;
  }

  const vendors = Array.from(vendorMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.vendorEarningsCents - a.vendorEarningsCents);

  return (
    <main className="page-shell-wide py-8 px-2 md:px-8">
      <header className="section-header mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Vendor Earnings Übersicht</h1>
        <p className="text-muted text-sm">Alle Einnahmen gruppiert nach Vendor.</p>
      </header>
      <div className="neumorph-card p-4 md:p-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-2 pr-4">Vendor</th>
              <th className="py-2 pr-4">E-Mail</th>
              <th className="py-2 pr-4">Orders</th>
              <th className="py-2 pr-4">Umsatz</th>
              <th className="py-2 pr-4">Vendor Earnings</th>
              <th className="py-2 pr-4">Plattform Earnings</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-8">Noch keine Vendor-Einnahmen vorhanden.</td>
              </tr>
            ) : (
              vendors.map(vendor => (
                <tr key={vendor.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{vendor.vendorName}</td>
                  <td className="py-2 pr-4">{vendor.vendorEmail}</td>
                  <td className="py-2 pr-4">{vendor.totalOrders}</td>
                  <td className="py-2 pr-4">{formatCHF(vendor.totalRevenueCents)}</td>
                  <td className="py-2 pr-4">{formatCHF(vendor.vendorEarningsCents)}</td>
                  <td className="py-2 pr-4">{formatCHF(vendor.platformEarningsCents)}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/admin/payouts/vendors/${vendor.id}`} className="neobtn-sm">Details</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
