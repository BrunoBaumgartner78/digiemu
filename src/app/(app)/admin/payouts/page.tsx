// src/app/admin/payouts/page.tsx
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminVendorListRowLite } from "@/lib/admin-types";
import Link from "next/link";
import { parsePayoutSearchParams, serializePayoutFilters } from "@/lib/payout-filters";

type SearchParams = { [key: string]: string | string[] | undefined };
type Props = { searchParams?: Promise<SearchParams> };

export const metadata = {
  title: "Admin – Vendor Auszahlungen",
};

export default async function AdminPayoutsPage(props: Props) {
  const session = await getServerSession(auth);

  if (!session || session.user.role !== "ADMIN") {
    // Unauthorized-View beibehalten
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="neumorph-card p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-2">Zugriff verweigert</h1>
          <p className="opacity-80">
            Nur Administratoren dürfen dieses Panel sehen.
          </p>
        </div>
      </div>
    );
  }

  // Alle Vendoren laden
  const vendorsRaw = await prisma.user.findMany({
    where: { role: "VENDOR" },
    include: {
      vendorProfile: true,
      products: {
        select: {
          id: true,
          orders: {
            select: {
              vendorEarningsCents: true,
            },
          },
        },
      },
      payouts: true,
    },
  });

  const vendors = vendorsRaw as AdminVendorListRowLite[];

  // Read filters from searchParams
  const sp = props.searchParams ? await props.searchParams : {};
  const filters = parsePayoutSearchParams(sp);

  // Payouts listing (paginated)
  const pageSize = 25;
  const page = Math.max(1, filters.page ?? 1);

  const payoutsWhere: any = {};
  if (filters.status) payoutsWhere.status = filters.status;
  if (filters.vendorId) payoutsWhere.vendorId = filters.vendorId;
  if (filters.dateFrom || filters.dateTo) payoutsWhere.createdAt = {};
  if (filters.dateFrom) payoutsWhere.createdAt.gte = new Date(filters.dateFrom);
  if (filters.dateTo) payoutsWhere.createdAt.lte = new Date(filters.dateTo);

  const [payoutsRaw, payoutsCount] = await Promise.all([
    prisma.payout.findMany({
      where: payoutsWhere,
      orderBy: { createdAt: "desc" },
      include: { vendor: { select: { id: true, email: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payout.count({ where: payoutsWhere }),
  ]);

  const payoutPages = Math.max(1, Math.ceil(payoutsCount / pageSize));

  // Berechnung der Vendor-Earnings
  const vendorRows = vendors.map((vendor) => {
    const earnings = vendor.products.flatMap((p) => p.orders.map((o) => o.vendorEarningsCents || 0));

    const totalEarnings = earnings.reduce((a, b) => a + b, 0);

    const alreadyPaid = vendor.payouts
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amountCents, 0);

    const pending = Math.max(totalEarnings - alreadyPaid, 0);

    return {
      vendor,
      totalEarnings,
      alreadyPaid,
      pending,
    } as {
      vendor: AdminVendorListRowLite;
      totalEarnings: number;
      alreadyPaid: number;
      pending: number;
    };
  });

  return (
    <div className="admin-shell">
      {/* Breadcrumb + Header */}
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Payouts</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Vendor Auszahlungen</h1>
        <p className="admin-subtitle">
          Übersicht über verdiente Beträge, bereits ausgezahlte Summen und
          offene Payouts pro Vendor.
        </p>
      </header>

      <section className="space-y-8">
        {/* Filters + Payouts list */}
        <section className="admin-card p-4">
          <form method="GET" className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs">Status</label>
              <select name="status" defaultValue={filters.status ?? ""} className="input-neu">
                <option value="">Alle</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="text-xs">Vendor</label>
              <select name="vendorId" defaultValue={filters.vendorId ?? ""} className="input-neu w-56">
                <option value="">Alle Vendoren</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.vendorProfile?.displayName ?? v.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs">Von</label>
              <input type="date" name="from" defaultValue={filters.dateFrom ?? ""} className="input-neu" />
            </div>

            <div>
              <label className="text-xs">Bis</label>
              <input type="date" name="to" defaultValue={filters.dateTo ?? ""} className="input-neu" />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="neobtn-sm">Anwenden</button>
              <a href="/admin/payouts" className="neobtn-sm ghost">Zurücksetzen</a>
            </div>

            <div className="ml-auto">
              <a href={`/api/admin/payouts/list?${serializePayoutFilters({ status: filters.status, vendorId: filters.vendorId, dateFrom: filters.dateFrom, dateTo: filters.dateTo })}&format=csv`} className="neobtn-sm">Export CSV</a>
            </div>
          </form>
        </section>

        {/* Payouts list table */}
        <section className="admin-card p-4">
          <div className="mb-2 text-xs text-[var(--text-muted)]">{payoutsCount} Auszahlungen · Seite {filters.page} / {payoutPages}</div>

          {payoutsRaw.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">Keine Auszahlungen gefunden.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm admin-table">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left">Datum</th>
                    <th className="py-2 px-3 text-left">Payout ID</th>
                    <th className="py-2 px-3 text-left">Vendor</th>
                    <th className="py-2 px-3 text-left">Betrag</th>
                    <th className="py-2 px-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutsRaw.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 px-3">{p.createdAt.toLocaleDateString("de-CH")}</td>
                      <td className="py-2 px-3">{p.id}</td>
                      <td className="py-2 px-3">{p.vendor?.email ?? p.vendorId}</td>
                      <td className="py-2 px-3">{(p.amountCents/100).toFixed(2)} CHF</td>
                      <td className="py-2 px-3">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {payoutPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              {Array.from({ length: payoutPages }, (_, i) => i + 1).map((pg) => (
                <Link key={pg} href={`/admin/payouts?${serializePayoutFilters({ status: filters.status, vendorId: filters.vendorId, dateFrom: filters.dateFrom, dateTo: filters.dateTo, page: pg })}`} className={`px-3 py-1 rounded-full border text-xs ${pg === (filters.page ?? 1) ? 'bg-[var(--accent)] text-white' : ''}`}>
                  {pg}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Vendor summary (kept below) */}
        <div className="space-y-4">
          {vendorRows.map(({ vendor, totalEarnings, alreadyPaid, pending }) => (
            <div
              key={vendor.id}
              className="admin-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h2 className="font-semibold text-lg text-[var(--text-main)]">
                  {vendor.vendorProfile?.displayName || vendor.email}
                </h2>

                <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
                  Vendor seit{" "}
                  {new Date(vendor.createdAt).toLocaleDateString("de-CH")}
                </p>

                <div className="space-y-1 text-sm">
                  <div>
                    Total verdient:{" "}
                    <span className="font-semibold">
                      {(totalEarnings / 100).toFixed(2)} CHF
                    </span>
                  </div>
                  <div>
                    Bereits ausgezahlt:{" "}
                    <span className="font-semibold">
                      {(alreadyPaid / 100).toFixed(2)} CHF
                    </span>
                  </div>
                  <div>
                    Offen:{" "}
                    <span className="font-semibold text-[var(--accent)]">
                      {(pending / 100).toFixed(2)} CHF
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 text-right">
                {pending > 0 ? (
                  <form action={`/api/admin/payouts/create`} method="POST">
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <button className="neobtn-sm">
                      Auszahlung erstellen
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">
                    Keine Auszahlung offen
                  </span>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/admin/payouts/vendor/${vendor.id}`}
                    className="neobtn-sm ghost"
                  >
                    Details ansehen →
                  </Link>

                  <a
                    href={`/api/admin/payouts/list?vendorId=${encodeURIComponent(vendor.id)}&format=csv`}
                    className="neobtn-sm"
                  >
                    CSV export
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
