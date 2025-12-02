// src/app/dashboard/payouts/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") redirect("/login");

  const vendorId = user.id;

  // Alle Payouts des Vendors
  const payouts = await prisma.payout.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });

  // Summen
  const paidAgg = await prisma.payout.aggregate({
    _sum: { amountCents: true },
    where: { vendorId, status: "PAID" },
  });

  const pendingAgg = await prisma.payout.aggregate({
    _sum: { amountCents: true },
    where: { vendorId, status: "PENDING" },
  });

  const totalPaid = paidAgg._sum.amountCents ?? 0;
  const totalPending = pendingAgg._sum.amountCents ?? 0;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-100/80 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Auszahlungen
            </h1>
            <p className="text-sm text-slate-500">
              Übersicht über bezahlte und ausstehende Auszahlungen.
            </p>
          </div>
        </header>

        {/* KPI-CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Bisher ausgezahlt"
            value={`${(totalPaid / 100).toFixed(2)} CHF`}
          />
          <KpiCard
            label="Ausstehend"
            value={`${(totalPending / 100).toFixed(2)} CHF`}
          />
        </section>

        {/* TABELLE */}
        <section className="rounded-3xl bg-white shadow-lg p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Auszahlungs-Historie
          </h2>

          {payouts.length === 0 ? (
            <p className="text-xs text-slate-400">
              Noch keine Auszahlungen.
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-2 px-3 text-left">Datum</th>
                  <th className="py-2 px-3 text-left">Betrag</th>
                  <th className="py-2 px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b">
                    <td className="py-2 px-3">
                      {new Date(payout.createdAt).toLocaleString("de-CH")}
                    </td>
                    <td className="py-2 px-3">
                      {(payout.amountCents / 100).toFixed(2)} CHF
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {payout.status === "PAID" ? "Bezahlt" : "Ausstehend"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 shadow p-4">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}
