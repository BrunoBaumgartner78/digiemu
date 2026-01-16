// src/app/admin/payouts/vendor/[vendorId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { vendorId: string };

export default async function VendorPayoutPage(props: { params: Promise<Params> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id || user.role !== "ADMIN") {
    return (
      <main className="p-8">
        <div className="neumorph-card p-6 max-w-md text-center">
          <h1 className="text-xl font-bold">Zugriff verweigert</h1>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Nur Administratoren dürfen diese Seite ansehen.
          </p>
          <Link href="/admin" className="neobtn">
            Zurück zum Admin-Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { vendorId } = await props.params;

  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      products: { include: { orders: { select: { vendorEarningsCents: true } } } },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!vendor) {
    return (
      <main className="p-8">
        <div className="neumorph-card p-6 max-w-md text-center">
          <h1 className="text-xl font-bold">Vendor nicht gefunden</h1>
          <Link href="/admin/payouts" className="neobtn mt-4 inline-block">
            Zurück zur Übersicht
          </Link>
        </div>
      </main>
    );
  }

  const totalEarnings = vendor.products
    .flatMap((p) => p.orders.map((o) => o.vendorEarningsCents ?? 0))
    .reduce((a, b) => a + b, 0);

  const alreadyPaid = vendor.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const pendingAmount = Math.max(totalEarnings - alreadyPaid, 0);
  const returnTo = `/admin/payouts/vendor/${vendor.id}`;

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <header className="section-header">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Auszahlungen – {vendor.name || vendor.email}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Übersicht aller Einnahmen und Auszahlungen dieses Vendors.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/admin/vendors/${vendor.id}`} className="neobtn-sm ghost">
              ← Vendor-Details
            </Link>
            <Link href="/admin/payouts" className="neobtn-sm ghost">
              ← Payout-Übersicht
            </Link>
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="neumorph-card p-5">
          <h3 className="text-xs opacity-70 mb-1">Gesamte Einnahmen</h3>
          <p className="text-2xl font-bold">CHF {(totalEarnings / 100).toFixed(2)}</p>
        </div>

        <div className="neumorph-card p-5">
          <h3 className="text-xs opacity-70 mb-1">Ausbezahlt</h3>
          <p className="text-2xl font-bold">CHF {(alreadyPaid / 100).toFixed(2)}</p>
        </div>

        <div className="neumorph-card p-5">
          <h3 className="text-xs opacity-70 mb-1">Ausstehend</h3>
          <p className="text-2xl font-bold">CHF {(pendingAmount / 100).toFixed(2)}</p>

          {pendingAmount > 0 && (
            <form action="/api/admin/payouts/create" method="POST" className="mt-4">
              <input type="hidden" name="vendorId" value={vendor.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button className="neobtn primary w-full">Auszahlung erstellen</button>
            </form>
          )}
        </div>
      </section>

      {/* List */}
      <section className="neumorph-card p-6">
        <h2 className="text-xl font-semibold mb-4">Bisherige Auszahlungen</h2>

        {vendor.payouts.length === 0 ? (
          <p className="opacity-70 text-sm">Noch keine Auszahlungen.</p>
        ) : (
          <div className="space-y-3">
            {vendor.payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex justify-between items-center p-3 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-[var(--neo-card-border)]"
              >
                <div>
                  <p className="font-semibold">CHF {(payout.amountCents / 100).toFixed(2)}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {payout.createdAt.toLocaleDateString("de-CH")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      payout.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-yellow-500/10 text-yellow-300"
                    }`}
                  >
                    {payout.status}
                  </span>

                  {payout.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <form action="/api/admin/payouts/mark-paid" method="POST">
                        <input type="hidden" name="payoutId" value={payout.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button className="neobtn-sm primary">Als bezahlt markieren</button>
                      </form>

                      <form action="/api/admin/payouts/cancel" method="POST">
                        <input type="hidden" name="payoutId" value={payout.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button className="neobtn-sm ghost">Stornieren</button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
