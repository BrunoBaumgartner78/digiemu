// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./DashboardHome.module.css";
import { Trophy, DownloadCloud, Package } from "lucide-react";

// ✅ NEW: client chart (fetches /api/analytics/revenue-30d itself)
import Revenue30dChart from "@/components/analytics/Revenue30dChart";

export const dynamic = "force-dynamic";

function chf(cents: number) {
  return `${(cents / 100).toFixed(2)} CHF`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    redirect("/account/downloads");
  }

  const vendorId = user.id as string;

  // ✅ only 30 days (for KPIs + downloads range)
  const rangeDays = 30;
  const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
  const rangeStart = new Date(Date.now() - rangeMs);

  // ✅ paid-like statuses (same as your current logic)
  const paidLikeStatuses = [
    "PAID",
    "paid",
    "COMPLETED",
    "completed",
    "SUCCESS",
    "success",
  ];

  /* ===================== DATA ===================== */
  const [
    products,
    ordersRange, // still used for KPI (grossRange)
    ordersAll,   // used for KPIs + top products
    payoutsPaidAgg,
    payoutsPendingCount,
    downloadsAll,
    downloadsRange,
    recentDownloads,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.order.findMany({
      where: {
        product: { vendorId },
        createdAt: { gte: rangeStart },
        status: { in: paidLikeStatuses as any },
      },
      select: { createdAt: true, amountCents: true, productId: true },
    }),

    prisma.order.findMany({
      where: {
        product: { vendorId },
        status: { in: paidLikeStatuses as any },
      },
      select: { amountCents: true, vendorEarningsCents: true, productId: true },
    }),

    prisma.payout.aggregate({
      _sum: { amountCents: true },
      where: { vendorId, status: "PAID" },
    }),

    prisma.payout.count({
      where: { vendorId, status: "PENDING" },
    }),

    prisma.downloadLink.count({
      where: {
        order: {
          product: { vendorId },
          status: { in: paidLikeStatuses as any },
        },
      },
    }),

    prisma.downloadLink.count({
      where: {
        createdAt: { gte: rangeStart },
        order: {
          product: { vendorId },
          status: { in: paidLikeStatuses as any },
        },
      },
    }),

    prisma.downloadLink.findMany({
      where: {
        order: {
          product: { vendorId },
          status: { in: paidLikeStatuses as any },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        order: { select: { product: { select: { title: true } } } },
      },
    }),
  ]);

  /* ===================== KPIs (20/80 Split) ===================== */
  const grossAllCents = ordersAll.reduce((s, o) => s + (o.amountCents ?? 0), 0);
  const grossRangeCents = ordersRange.reduce((s, o) => s + (o.amountCents ?? 0), 0);

  let vendorAllCents = ordersAll.reduce((s, o) => s + (o.vendorEarningsCents ?? 0), 0);
  if (vendorAllCents === 0 && grossAllCents > 0) {
    vendorAllCents = Math.round(grossAllCents * 0.8);
  }

  const platformAllCents = Math.max(grossAllCents - vendorAllCents, 0);

  const paidOutCents = payoutsPaidAgg._sum.amountCents ?? 0;
  const availableCents = Math.max(vendorAllCents - paidOutCents, 0);

  const isEmpty = grossAllCents === 0;

  /* ===================== TOP PRODUCTS (ALL TIME) ===================== */
  const productMap: Record<string, number> = {};
  for (const o of ordersAll) {
    const pid = o.productId;
    if (!pid) continue;
    productMap[pid] = (productMap[pid] ?? 0) + (o.amountCents ?? 0);
  }

  const topProducts = Object.entries(productMap)
    .map(([id, sum]) => ({
      id,
      sum,
      title: products.find((p) => p.id === id)?.title ?? "Produkt",
    }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 5);

  return (
    <main className="page-shell-wide">
      <section className={`neo-surface p-6 md:p-8 space-y-10 ${styles.dashboardShell}`}>
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Verkäufer-Dashboard
            </h1>
            <p className="text-sm opacity-80">Verkäufe, Einnahmen & Downloads</p>
          </div>

          <Link href="/dashboard/new" className={styles.dashboardPrimaryLink}>
            Neues Produkt
          </Link>
        </header>

        {/* EMPTY STATE */}
        {isEmpty && (
          <section className={`${styles.statCard} ${styles.emptyStateCard ?? ""}`}>
            <div className={styles.emptyState ?? "grid gap-3"}>
              <div className={styles.emptyIcon ?? ""} aria-hidden>
                🪄
              </div>
              <div>
                <h2 className={styles.emptyTitle ?? ""}>Noch keine Verkäufe</h2>
                <p className={styles.emptyText ?? ""}>
                  Lade dein erstes Produkt hoch und teile den Link — sobald Verkäufe reinkommen,
                  erscheinen hier Charts & Top-Produkte.
                </p>
                <div style={{ marginTop: 12 }}>
                  <Link href="/dashboard/new" className={styles.emptyCtaPrimary ?? ""}>
                    Erstes Produkt erstellen →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* KPI GRID */}
        <section className={styles.kpiGrid}>
          <Kpi label="Produkte" value={products.length} />

          <Kpi
            label="Downloads"
            value={downloadsAll}
            sub={`${rangeDays} Tage: ${downloadsRange}`}
          />

          <Kpi
            label="Umsatz (Brutto)"
            value={chf(grossAllCents)}
            sub={`${rangeDays} Tage: ${chf(grossRangeCents)}`}
          />

          <Kpi
            label="Auszahlbar (80%)"
            value={chf(availableCents)}
            sub={`Vendor (80%): ${chf(vendorAllCents)} · Plattform (20%): ${chf(
              platformAllCents
            )} · Offen: ${payoutsPendingCount}`}
          />
        </section>

        {/* ✅ NEW DAILY CHART (real 30-day bars via API) */}
        <Revenue30dChart />

        {/* TOP PRODUCTS */}
        <section className={`${styles.statCard} space-y-4`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Trophy size={16} /> Top Produkte (All-Time)
          </h2>

          {topProducts.length === 0 ? (
            <p className="text-sm text-white/70">Noch keine Verkäufe</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-white/15 pb-2"
                >
                  <div className="text-sm text-white/90 font-medium truncate">
                    #{idx + 1} {p.title}
                  </div>
                  <div className="text-xs text-white/80 font-mono">
                    {(p.sum / 100).toFixed(2)} CHF
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-white/60">
                Darstellung als Ranking (stabil & immer sichtbar).
              </p>
            </div>
          )}
        </section>

        {/* RECENT DOWNLOADS */}
        <section className={`${styles.statCard}`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <DownloadCloud size={16} /> Neueste Downloads
          </h2>

          {recentDownloads.length === 0 ? (
            <p className="text-xs text-white/70">Noch keine Downloads</p>
          ) : (
            <ul className={styles.recentList ?? "space-y-2"}>
              {recentDownloads.map((d) => (
                <li key={d.id} className={styles.recentItem ?? ""}>
                  <span className={styles.recentBullet ?? ""}>⬇</span>
                  <span className={styles.recentTitle ?? ""}>
                    {d.order?.product?.title ?? "Unbekannt"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PRODUCTS */}
        <section className={`${styles.statCard}`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Package size={16} /> Deine Produkte
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-white/70">Noch keine Produkte</p>
          ) : (
            <ul className={styles.productsList ?? "space-y-2"}>
              {products.map((p) => (
                <li key={p.id} className={styles.productRow}>
                  <span className={styles.productTitle}>{p.title}</span>

                  <div className={styles.productActions}>
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className={styles.productActionLink}
                    >
                      Bearbeiten
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

/* ===================== SUB ===================== */
function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSubLabel}>{sub}</div>}
    </div>
  );
}
