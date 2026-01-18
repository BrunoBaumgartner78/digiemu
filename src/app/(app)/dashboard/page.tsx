// src/app/dashboard/page.tsx
import { requireRolePage } from "@/lib/guards/authz";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import styles from "./DashboardHome.module.css";
import { LineChart, Trophy, DownloadCloud, Package } from "lucide-react";
import VendorProfileGateCard from "@/components/vendor/VendorProfileGateCard";

export const dynamic = "force-dynamic";

function chf(cents: number) {
  return `${(cents / 100).toFixed(2)} CHF`;
}

export default async function DashboardPage() {
  const session = await requireRolePage(["VENDOR", "ADMIN"]);
  if (!session?.user) redirect("/login");

  // ✅ dank typisiertem authz.ts ist role sauber AppRole
  const user = session.user;
  const role = user.role;

  if (role !== "VENDOR" && role !== "ADMIN") {
    redirect("/account/downloads");
  }

  // vendorId im Datenmodell = User.id (Vendor)
  const vendorId = String(user.id ?? "");

  // Falls aus irgendeinem Grund keine ID in der Session ist:
  if (!vendorId) redirect("/login");

  // fetch vendor profile for gate (only for VENDOR role)
  let vp: Prisma.VendorProfileGetPayload<{
    select: { status: true; isPublic: true };
  }> | null = null;

  if (role === "VENDOR") {
    vp = await prisma.vendorProfile.findUnique({
      where: { userId: user.id }, // user.id ist bei AppSession vorhanden (ggf. optional, aber hier ok)
      select: { status: true, isPublic: true },
    });
  }

  const vpStatus = String(vp?.status ?? "UNKNOWN").toUpperCase();
  const canSell = vpStatus === "APPROVED" && !!vp?.isPublic;

  // ✅ nur 30 Tage (kein Toggle mehr)
  const rangeDays = 30;
  const rangeMs = rangeDays * 24 * 60 * 60 * 1000;
  // eslint-disable-next-line react-hooks/purity -- stable server-time needed for chart buckets
  const now = Date.now();
  const rangeStart = new Date(now - rangeMs);

  // ✅ nur bezahlte Orders zählen (wie Earnings/Payouts)
  const paidLikeStatuses = [
    "PAID",
    "paid",
    "COMPLETED",
    "completed",
    "SUCCESS",
    "success",
  ] as const;

  /* ===================== DATA ===================== */
  const [
    products,
    ordersRange,
    ordersAll,
    payoutsPaidAgg,
    payoutsPendingCount,
    downloadsAll,
    downloadsRange,
    recentDownloads,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
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
  // Brutto (100%)
  const grossAllCents = ordersAll.reduce((s, o) => s + (o.amountCents ?? 0), 0);
  const grossRangeCents = ordersRange.reduce((s, o) => s + (o.amountCents ?? 0), 0);

  // Vendor (80%) – prefer gespeichertes vendorEarningsCents, fallback 80% von gross
  let vendorAllCents = ordersAll.reduce((s, o) => s + (o.vendorEarningsCents ?? 0), 0);
  if (vendorAllCents === 0 && grossAllCents > 0) {
    vendorAllCents = Math.round(grossAllCents * 0.8);
  }

  // range orders haben vendorEarningsCents nicht selektiert → 80% fallback
  const vendorRangeCents = grossRangeCents > 0 ? Math.round(grossRangeCents * 0.8) : 0;

  const platformAllCents = Math.max(grossAllCents - vendorAllCents, 0);

  // Auszahlbar basiert auf Vendor-Anteil, nicht auf Brutto
  const paidOutCents = payoutsPaidAgg._sum.amountCents ?? 0;
  const availableCents = Math.max(vendorAllCents - paidOutCents, 0);

  const isEmpty = grossAllCents === 0;

  /* ===================== CHART 1: DAILY (30) ===================== */
  const dayMap: Record<string, number> = {};
  for (const o of ordersRange) {
    const key = o.createdAt.toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] ?? 0) + (o.amountCents ?? 0);
  }

  const days: { day: string; sum: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    days.push({ day: d, sum: dayMap[d] ?? 0 });
  }

  const maxDay = Math.max(1, ...days.map((d) => d.sum));
  const maxIndex = days.findIndex((d) => d.sum === maxDay && d.sum > 0);
  const maxLabel = maxDay > 0 ? `Max ${(maxDay / 100).toFixed(2)} CHF` : "Max 0 CHF";

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
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Verkäufer-Dashboard</h1>
            <p className="text-sm opacity-80">Verkäufe, Einnahmen & Downloads</p>
          </div>

          {canSell ? (
            <Link href="/dashboard/new" className={styles.dashboardPrimaryLink}>
              Neues Produkt
            </Link>
          ) : (
            <span className={`${styles.dashboardPrimaryLink} opacity-40 pointer-events-none`}>
              Neues Produkt
            </span>
          )}
        </header>

        {/* Vendor profile gate */}
        {role === "VENDOR" ? (
          <div className="mt-4">
            <VendorProfileGateCard status={vp?.status ?? null} isPublic={vp?.isPublic ?? null} />
          </div>
        ) : null}

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
          <Kpi label="Downloads" value={downloadsAll} sub={`${rangeDays} Tage: ${downloadsRange}`} />

          <Kpi
            label="Umsatz (Brutto)"
            value={chf(grossAllCents)}
            sub={`${rangeDays} Tage: ${chf(grossRangeCents)} · Vendor: ${chf(vendorRangeCents)}`}
          />

          <Kpi
            label="Auszahlbar (80%)"
            value={chf(availableCents)}
            sub={`Vendor (80%): ${chf(vendorAllCents)} · Plattform (20%): ${chf(
              platformAllCents
            )} · Offen: ${payoutsPendingCount}`}
          />
        </section>

        {/* DAILY CHART */}
        <section className={`${styles.statCard} space-y-3`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <LineChart size={16} /> Einnahmen – letzte {rangeDays} Tage
            </h2>
            <div className="text-[11px] text-white/70">{maxLabel}</div>
          </div>

          <div className="mt-2 rounded-2xl p-4 bg-[radial-gradient(circle_at_0_100%,#0b1120,#020617)] shadow-[inset_0_0_0_1px_rgba(30,64,175,0.7),inset_0_10px_24px_rgba(0,0,0,0.35)]">
            <div className="flex items-end gap-[4px] h-[180px]">
              {days.map((d, idx) => {
                const h = Math.max(6, Math.round((d.sum / maxDay) * 160));
                const title =
                  d.sum === 0
                    ? `${d.day}: keine Verkäufe`
                    : `${d.day}: ${(d.sum / 100).toFixed(2)} CHF`;
                const isMax = idx === maxIndex && d.sum > 0;

                return (
                  <div
                    key={d.day}
                    title={title}
                    style={{ height: `${h}px` }}
                    className={[
                      "flex-1 min-w-[3px] rounded-full",
                      "bg-gradient-to-t from-emerald-400 via-blue-500 to-indigo-500",
                      "shadow-[0_10px_22px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.10)]",
                      "transition-transform duration-150",
                      "hover:scale-x-[1.25] hover:brightness-110",
                      isMax ? "ring-1 ring-white/60" : "",
                    ].join(" ")}
                  />
                );
              })}
            </div>

            <p className="mt-3 text-[12px] text-white/65">Hover: Balken-Highlight · Max-Tag markiert</p>
          </div>
        </section>

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
                  <div className="text-xs text-white/80 font-mono">{(p.sum / 100).toFixed(2)} CHF</div>
                </div>
              ))}
              <p className="text-[11px] text-white/60">Darstellung als Ranking (stabil & immer sichtbar).</p>
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
