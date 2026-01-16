// src/app/admin/payouts/page.tsx
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AdminVendorListRowLite, AdminPayoutListRow } from "@/lib/admin-types";
import Link from "next/link";

export const metadata = {
  title: "Admin – Vendor Auszahlungen",
};

export default async function AdminPayoutsPage() {
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

      {vendorRows.length === 0 ? (
        <div className="admin-card">
          <p className="text-sm text-[var(--text-muted)]">
            Keine Vendoren verfügbar.
          </p>
        </div>
      ) : (
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

                <Link
                  href={`/admin/payouts/vendor/${vendor.id}`}
                  className="neobtn-sm ghost"
                >
                  Details ansehen →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
