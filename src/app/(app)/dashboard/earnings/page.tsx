// src/app/dashboard/earnings/page.tsx
import Link from "next/link";
import { requireVendorPage } from "@/lib/guards/authz";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Einnahmen – Vendor Dashboard",
};

export const dynamic = "force-dynamic";

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default async function VendorEarningsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const session = await requireVendorPage();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "VENDOR") redirect("/login");

  const vendorId = String(user.id);

  const paidLikeStatuses = [
    "PAID",
    "paid",
    "COMPLETED",
    "completed",
    "SUCCESS",
    "success",
  ];

  // Pagination
  const pageSize = 25;
  const pageRaw = Number(searchParams?.page ?? "1");
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;

  // ======================================================================
  // ✅ GROSS (Brutto Umsatz) — in deinem Schema: Order.amountCents
  // ======================================================================
  const grossAgg = await prisma.order.aggregate({
    _sum: { amountCents: true },
    where: {
      product: { vendorId },
      status: { in: paidLikeStatuses as any },
    },
  });
  const grossCents = grossAgg._sum.amountCents ?? 0;

  // ======================================================================
  // ✅ Vendor-Earnings (robust)
  // 1) Prefer: OrderItem.vendorEarningsCents (über product.vendorId)
  // 2) Fallback: Order.vendorEarningsCents
  // 3) Final fallback: 80% von gross
  // ======================================================================
  let vendorEarningsCents = 0;

  // 1) Try OrderItem aggregate
  try {
    const hasOrderItemAggregate =
      typeof (prisma as any).orderItem?.aggregate === "function";

    if (hasOrderItemAggregate) {
      const vendorAgg = await (prisma as any).orderItem.aggregate({
        _sum: { vendorEarningsCents: true },
        where: {
          // ✅ wichtig: über product.vendorId filtern (nicht orderItem.vendorId)
          product: { vendorId },
          order: { status: { in: paidLikeStatuses } },
        },
      });

      vendorEarningsCents = vendorAgg?._sum?.vendorEarningsCents ?? 0;
    }
  } catch {
    // ignore → fallback below
  }

  // 2) Fallback: Order.vendorEarningsCents
  if (!vendorEarningsCents) {
    try {
      const vendorAgg = await prisma.order.aggregate({
        _sum: { vendorEarningsCents: true },
        where: {
          product: { vendorId },
          status: { in: paidLikeStatuses as any },
        },
      });
      vendorEarningsCents = vendorAgg._sum.vendorEarningsCents ?? 0;
    } catch {
      // ignore → fallback below
    }
  }

  // 3) Final fallback: 80% von gross
  if (!vendorEarningsCents && grossCents > 0) {
    vendorEarningsCents = Math.round(grossCents * 0.8);
  }

  // Verkäufe count (bezahlt)
  const salesCount = await prisma.order.count({
    where: {
      product: { vendorId },
      status: { in: paidLikeStatuses as any },
    },
  });

  // Total für Pagination
  const totalCount = salesCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = clamp(page, 1, totalPages);
  const safeSkip = (safePage - 1) * pageSize;

  /**
   * ✅ Historie:
   * In deinem Schema heißt die Relation nicht `user`, sondern `buyer`.
   */
  const orders = await prisma.order.findMany({
    where: {
      product: { vendorId },
      status: { in: paidLikeStatuses as any },
    },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip: safeSkip,
    include: {
      product: {
        select: { id: true, title: true },
      },
      buyer: {
        select: { email: true, name: true },
      },
    },
  });

  function pageHref(p: number) {
    return `/dashboard/earnings?page=${p}`;
  }

  // Simple page number window
  const windowSize = 5;
  const start = Math.max(1, safePage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const start2 = Math.max(1, end - windowSize + 1);

  return (
    <main className="page-shell-wide">
      <section className="neo-surface p-6 md:p-8 space-y-10">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Einnahmen
          </h1>
          <p className="text-sm text-white/75 max-w-2xl">
            Übersicht über deinen Umsatz (brutto), deine Vendor-Earnings (nach
            Split) und die letzten Verkäufe.
          </p>
        </header>

        {/* Summary (wie Auszahlungen) */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="neo-card p-6 md:p-7">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Gesamtumsatz (Brutto)
            </div>
            <div className="mt-3 text-2xl font-extrabold text-white">
              {chf(grossCents)}
            </div>
            <div className="mt-2 text-xs text-white/60">
              Summe aller bezahlten Bestellungen (vor Split).
            </div>
          </div>

          <div className="neo-card p-6 md:p-7">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Vendor-Earnings (80%)
            </div>
            <div className="mt-3 text-2xl font-extrabold text-white">
              {chf(vendorEarningsCents)}
            </div>
            <div className="mt-2 text-xs text-white/60">
              Dein Anteil nach Split (Basis für Auszahlungen).
            </div>
          </div>

          <div className="neo-card p-6 md:p-7">
            <div className="text-xs uppercase tracking-[0.18em] text-white/70">
              Verkäufe
            </div>
            <div className="mt-3 text-2xl font-extrabold text-white">
              {salesCount}
            </div>
            <div className="mt-2 text-xs text-white/60">
              Anzahl bezahlter Bestellungen.
            </div>
          </div>
        </section>

        {/* History */}
        <section className="neo-card p-6 md:p-7">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold text-white">
              Einnahmenhistorie
            </h2>
            <div className="text-xs text-white/60">
              {totalCount} Einträge
              {totalPages > 1 ? (
                <>
                  {" "}
                  · Seite {safePage} / {totalPages}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {orders.length === 0 ? (
              <p className="text-sm text-white/70">
                Noch keine bezahlten Bestellungen vorhanden.
              </p>
            ) : (
              orders.map((o) => {
                const buyerLabel =
                  o.buyer?.name?.trim() || o.buyer?.email || "Unbekannt";

                const gross = o.amountCents ?? 0;

                // ✅ Robust: wenn vendorEarningsCents am Order nicht gesetzt ist → 80% fallback
                const vendorPartRaw = o.vendorEarningsCents ?? 0;
                const vendorPart =
                  vendorPartRaw > 0 ? vendorPartRaw : Math.round(gross * 0.8);

                return (
                  <div
                    key={o.id}
                    className="neo-card-soft px-5 py-5 flex flex-col gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="text-sm font-semibold text-white">
                        {o.product?.title ?? "Produkt"}
                      </div>
                      <div className="text-xs text-white/65">
                        Käufer: {buyerLabel} · Datum:{" "}
                        {o.createdAt.toLocaleDateString("de-CH")}
                      </div>
                      <div className="text-xs text-white/70">
                        Brutto:{" "}
                        <span className="font-semibold text-white/85">
                          {chf(gross)}
                        </span>{" "}
                        · Vendor:{" "}
                        <span className="font-semibold text-white/85">
                          {chf(vendorPart)}
                        </span>
                      </div>
                    </div>

                    {/* Status Bar (wie Payouts, aber clean) */}
                    <div
                      className={[
                        "w-full rounded-full",
                        "px-5 py-2.5",
                        "text-center",
                        "text-[11px] font-extrabold tracking-[0.16em] uppercase",
                        "border border-white/18",
                        "text-white/90",
                        "shadow-[inset_-6px_-6px_12px_rgba(0,0,0,0.22),inset_6px_6px_12px_rgba(255,255,255,0.10)]",
                        "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))]",
                      ].join(" ")}
                    >
                      {o.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Link
                  href={pageHref(Math.max(1, safePage - 1))}
                  aria-disabled={safePage === 1}
                  className={[
                    "neo-btn",
                    safePage === 1 ? "pointer-events-none opacity-60" : "",
                  ].join(" ")}
                >
                  Zurück
                </Link>

                <Link
                  href={pageHref(Math.min(totalPages, safePage + 1))}
                  aria-disabled={safePage === totalPages}
                  className={[
                    "neo-btn",
                    safePage === totalPages
                      ? "pointer-events-none opacity-60"
                      : "",
                  ].join(" ")}
                >
                  Weiter
                </Link>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                {start2 > 1 ? (
                  <>
                    <Link href={pageHref(1)} className="neo-chip">
                      1
                    </Link>
                    {start2 > 2 ? <span className="text-white/50">…</span> : null}
                  </>
                ) : null}

                {Array.from(
                  { length: end - start2 + 1 },
                  (_, i) => start2 + i
                ).map((p) => (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className={[
                      "neo-chip",
                      p === safePage ? "neo-chip--active" : "",
                    ].join(" ")}
                  >
                    {p}
                  </Link>
                ))}

                {end < totalPages ? (
                  <>
                    {end < totalPages - 1 ? (
                      <span className="text-white/50">…</span>
                    ) : null}
                    <Link href={pageHref(totalPages)} className="neo-chip">
                      {totalPages}
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
