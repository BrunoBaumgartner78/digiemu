// src/app/dashboard/earnings/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EarningsChart from "@/components/vendor/EarningsChart";

export const metadata = {
  title: "Einnahmen – Vendor Dashboard",
};

export default async function EarningsDashboard() {
  const session = await getServerSession(authOptions);

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

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/vendor/earnings/chart`,
    {
      cache: "no-store",
      headers: { Cookie: "" }, // SSR fetch
    }
  );

  const { daily, totalEarnings } = await res.json();

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Einnahmen</h1>
        <p className="text-muted">
          Übersicht über deinen Umsatz und deine besten Produkte.
        </p>
      </header>

      <div className="neumorph-card p-6 mb-6">
        <h2 className="text-xl font-semibold">Gesamte Einnahmen</h2>
        <p className="text-3xl font-bold">
          CHF {totalEarnings?.toFixed(2) ?? "0.00"}
        </p>
      </div>

      <EarningsChart data={daily} />
    </div>
  );
}
