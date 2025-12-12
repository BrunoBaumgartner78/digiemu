import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import EarningsChart from "@/components/vendor/EarningsChart";

export const metadata = {
  title: "Einnahmen – Vendor Dashboard",
  description: "Übersicht deiner Einnahmen als Verkäufer",
};

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="neumorph-card p-8 text-center">
          <h1 className="text-xl font-bold mb-2">Bitte einloggen</h1>
          <p className="mb-4">Dieser Bereich ist nur für Verkäufer zugänglich.</p>
          <Link href="/auth/login" className="neobtn">Zum Login</Link>
        </div>
      </div>
    );
  }

  const vendorId = session.user.id;

  // Load vendor orders
  const orders = await prisma.order.findMany({
    where: { product: { vendorId } },
    include: { product: true },
    orderBy: { createdAt: "desc" }
  });

  const totalSales = orders.length;
  const totalEarningsCents = orders.reduce(
    (sum, o) => sum + (o.vendorEarningsCents ?? 0),
    0
  );
  const avgEarnings = totalSales > 0
    ? totalEarningsCents / totalSales
    : 0;

  // Earnings chart data
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ranges = ["7", "30", "90", "all"];
  const labels = { "7": "7 Tage", "30": "30 Tage", "90": "90 Tage", "all": "Alle" };

  // Get range from search params
  let rangeParam = "30";
  if (typeof window === "undefined") {
    // On server, get from URL
    const url = require("next/url");
    const reqUrl = url.parse(origin + "/dashboard/vendor/earnings" + (typeof window === "undefined" ? "" : window.location.search));
    const searchParams = new URLSearchParams(reqUrl.query);
    rangeParam = searchParams.get("range") || "30";
  }

  const chartRes = await fetch(
    `${origin}/api/vendor/earnings/chart?range=${rangeParam}`,
    { cache: "no-store" }
  );
  const chartData = await chartRes.json();
  const earningsByDay = chartData.earningsByDay ?? [];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Einnahmen</h1>
        <p className="text-sm opacity-70">
          Deine Einnahmen aus deinen verkauften digitalen Produkten.
        </p>
      </header>

      {/* KPI CARDS */}
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

      {/* EARNINGS CHART */}
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

        <EarningsChart data={earningsByDay} />
      </div>

      {/* RECENT ORDERS */}
      <div className="neumorph-card p-4 md:p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">
          Letzte Verkäufe
        </h2>

        {orders.length === 0 ? (
          <p className="opacity-70 text-sm">
            Noch keine Verkäufe vorhanden.
          </p>
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
              {orders.slice(0, 25).map((order) => (
                <tr key={order.id} className="border-b last:border-none">
                  <td className="py-3 font-semibold">
                    {order.product?.title ?? "Produkt"}
                  </td>
                  <td className="py-3">
                    {order.createdAt.toLocaleDateString("de-CH")}
                  </td>
                  <td className="py-3 text-amber-600 dark:text-amber-400">
                    CHF {(order.vendorEarningsCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
