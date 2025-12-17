// src/app/dashboard/payouts/page.tsx

import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Auszahlungen – Vendor Dashboard",
};

export default async function VendorPayoutsPage() {
  const session = await getServerSession(auth);

  // 🔐 Zugriff nur für Vendoren
  if (!session || session.user.role !== "VENDOR") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="neumorph-card p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-2">Zugriff verweigert</h1>
          <p className="text-sm opacity-75">
            Diese Seite ist nur für Verkäufer verfügbar.
          </p>
        </div>
      </div>
    );
  }

  const vendorId = session.user.id;

  // Vendor + Produkteinnahmen + Auszahlungen laden
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      products: {
        include: {
          orders: {
            select: { vendorEarningsCents: true },
          },
        },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    return (
      <div className="p-8">
        <div className="neumorph-card p-6">
          <h1 className="text-xl font-bold">Fehler</h1>
          <p>Vendor nicht gefunden.</p>
        </div>
      </div>
    );
  }

  // Einnahmen berechnen
  const totalEarnings = vendor.products
    .flatMap((p) => p.orders)
    .reduce((sum, o) => sum + (o.vendorEarningsCents || 0), 0);

  const alreadyPaid = vendor.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const pending = Math.max(totalEarnings - alreadyPaid, 0);

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold mb-2">Auszahlungen</h1>
        <p className="text-sm text-muted">
          Übersicht deiner Einnahmen und bisherigen Auszahlungen.
        </p>
      </header>

      {/* SUMMARY BOXES */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="neumorph-card p-5">
          <h3 className="text-sm opacity-70">Gesamte Einnahmen</h3>
          <p className="text-2xl font-bold">
            CHF {(totalEarnings / 100).toFixed(2)}
          </p>
        </div>

        <div className="neumorph-card p-5">
          <h3 className="text-sm opacity-70">Bereits ausbezahlt</h3>
          <p className="text-2xl font-bold">
            CHF {(alreadyPaid / 100).toFixed(2)}
          </p>
        </div>

        <div className="neumorph-card p-5">
          <h3 className="text-sm opacity-70">Ausstehend</h3>
          <p className="text-2xl font-bold">
            CHF {(pending / 100).toFixed(2)}
          </p>
          {pending > 0 && (
            <p className="text-xs opacity-60 mt-1">
              Auszahlung wird vom Admin freigegeben.
            </p>
          )}
        </div>
      </div>

      {/* PAYOUT LIST */}
      <div className="neumorph-card p-6">
        <h2 className="text-xl font-semibold mb-4">Auszahlungshistorie</h2>

        {vendor.payouts.length === 0 ? (
          <p className="opacity-70">Bisher wurden keine Auszahlungen vorgenommen.</p>
        ) : (
          <div className="space-y-3">
            {vendor.payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex justify-between items-center p-3 rounded-lg bg-white/30"
              >
                <div>
                  <p className="font-semibold">
                    CHF {(payout.amountCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted">
                    Erstellt am{" "}
                    {payout.createdAt.toLocaleDateString("de-CH")}
                  </p>
                  {payout.status === "PAID" && payout.paidAt && (
                    <p className="text-xs text-green-600">
                      Ausbezahlt am {payout.paidAt.toLocaleDateString("de-CH")}
                    </p>
                  )}
                </div>

                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    payout.status === "PAID"
                      ? "bg-green-200 text-green-700"
                      : "bg-yellow-200 text-yellow-700"
                  }`}
                >
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
