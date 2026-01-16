import Link from "next/link";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import EarningsChart from "@/components/vendor/EarningsChart";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ranges = ["7d", "30d", "90d"] as const;
const labels: Record<(typeof ranges)[number], string> = {
  "7d": "7 Tage",
  "30d": "30 Tage",
  "90d": "90 Tage",
};

export default async function VendorEarningsPage({
  searchParams,
}: {
  searchParams?: { range?: string };
}) {
  const session = await getServerSession(auth);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Bitte einloggen</h1>
          <p className="mb-4">
            Dieser Bereich ist nur für Verkäufer zugänglich.
          </p>
          <Link href="/login" className="neobtn primary">
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  const range = (searchParams?.range ?? "30d") as string;

  const orders = await prisma.order.findMany({
    where: { product: { vendorId: session.user.id }, status: "PAID" },
    include: { product: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const totalSales = orders.length;
  const totalEarningsCents = orders.reduce(
    (sum, o) => sum + (o.vendorEarningsCents ?? 0),
    0
  );
  const avgEarnings = totalSales > 0 ? totalEarningsCents / totalSales : 0;

  const earningsByDay: { date: string; value: number }[] = [];

  return (
    <div className="space-y-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Einnahmen</h1>
        <p className="text-sm opacity-70">
          Deine Einnahmen aus deinen verkauften digitalen Produkten.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Gesamtverkäufe</p>
          <p className="text-2xl font-bold">{totalSales}</p>
        </div>

        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Gesamt-Earnings</p>
          <p className="text-2xl font-bold">
            CHF {(totalEarningsCents / 100).toFixed(2)}
          </p>
        </div>

        <div className="neumorph-card p-5">
          <p className="text-sm opacity-70">Ø pro Verkauf</p>
          <p className="text-2xl font-bold">
            CHF {(avgEarnings / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="neumorph-card p-4 md:p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Einnahmen Verlauf</h2>

          <div className="flex gap-2">
            {ranges.map((r) => (
              <a
                key={r}
                href={`?range=${r}`}
                className="px-3 py-1 rounded-lg text-sm opacity-70 hover:opacity-100 neumorph-card"
              >
                {labels[r]}
              </a>
            ))}
          </div>
        </div>

        <EarningsChart data={earningsByDay.map(({ date, value }) => ({ date, earningsCents: value }))} />
      </div>

      <div className="neumorph-card p-4 md:p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Letzte Verkäufe</h2>

        {orders.length === 0 ? (
          <p className="opacity-70 text-sm">Noch keine Verkäufe vorhanden.</p>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-xs uppercase opacity-60 border-b">
                <th className="py-2 text-left">Produkt</th>
                <th className="py-2 text-left">Datum</th>
                <th className="py-2 text-left">Einnahmen</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-none">
                  <td className="py-3 font-semibold">
                    {order.product?.title ?? "Produkt"}
                  </td>
                  <td className="py-3">
                    {new Date(order.createdAt).toLocaleDateString("de-CH")}
                  </td>
                  <td className="py-3">
                    CHF {((order.vendorEarningsCents ?? 0) / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs opacity-60">
        Range: {range} (nur UI-Schalter, Daten-Aggregation folgt)
      </p>
    </div>
  );
}
