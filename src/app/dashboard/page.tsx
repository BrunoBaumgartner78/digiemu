// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./DashboardHome.module.css";

import { LineChart, Trophy, DownloadCloud, Package } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // ❗ nur wirklich nicht eingeloggte auf /login
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;
  const role = (user.role as string) ?? "BUYER";

  // ❗ BUYER nicht mehr auf /login schicken,
  //    sondern z.B. ins Käufer-Dashboard / Downloads
  if (role !== "VENDOR" && role !== "ADMIN") {
    redirect("/account/downloads");
  }

  const vendorId = user.id as string;

  // WICHTIG: any, damit das Destructuring weiter unten keinen Typ-Fehler auslöst
  let data: any = {};
  try {
    // ---------- PRODUCTS ----------
    const products = await prisma.product.findMany({
      where: { vendorId },
      orderBy: { updatedAt: "desc" },
    });

    // ---------- EARNINGS ----------
    const totalEarningsAgg = await prisma.order.aggregate({
      _sum: { amountCents: true },
      where: { product: { vendorId } },
    });

    const earningsLast30dAgg = await prisma.order.aggregate({
      _sum: { amountCents: true },
      where: {
        product: { vendorId },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const rawTotalEarnings = totalEarningsAgg._sum.amountCents ?? 0;
    const rawEarningsLast30d = earningsLast30dAgg._sum.amountCents ?? 0;

    // ---------- PAYOUTS ----------
    const totalPaidOutAgg = await prisma.payout.aggregate({
      _sum: { amountCents: true },
      where: { vendorId, status: "PAID" },
    });

    const rawTotalPaidOut = totalPaidOutAgg._sum.amountCents ?? 0;

    const pendingPayouts = await prisma.payout.count({
      where: { vendorId, status: "PENDING" },
    });

    const availableBalance = Math.max(rawTotalEarnings - rawTotalPaidOut, 0);

    // ---------- DOWNLOADS ----------
    const totalDownloads = await prisma.downloadLink.count({
      where: { order: { product: { vendorId } } },
    });

    const downloadsLast30d = await prisma.downloadLink.count({
      where: {
        order: { product: { vendorId } },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const recentDownloads = await prisma.downloadLink.findMany({
      where: { order: { product: { vendorId } } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        order: {
          select: {
            product: { select: { title: true } },
          },
        },
      },
    });

    // ---------- DOWNLOAD COUNTS PER PRODUCT ----------
    const downloadsForCounts = await prisma.downloadLink.findMany({
      where: { order: { product: { vendorId } } },
      select: { order: { select: { productId: true } } },
    });

    const downloadCounts: Record<string, number> = {};
    for (const d of downloadsForCounts) {
      const pid = d.order?.productId;
      if (!pid) continue;
      downloadCounts[pid] = (downloadCounts[pid] ?? 0) + 1;
    }

    // ---------- MINI EARNINGS CHART ----------
    const earningsRaw = await prisma.order.findMany({
      where: {
        product: { vendorId },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, amountCents: true },
    });

    const earningsByDayMap: Record<string, number> = {};
    for (const row of earningsRaw) {
      const day = row.createdAt.toISOString().slice(0, 10);
      earningsByDayMap[day] = (earningsByDayMap[day] ?? 0) + row.amountCents;
    }

    const earningsByDay = Object.entries(earningsByDayMap)
      .map(([day, sum]) => ({ day, sum }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const maxDaily = Math.max(
      earningsByDay.length ? Math.max(...earningsByDay.map((e) => e.sum)) : 0,
      1
    );

    // ---------- EARNINGS PER PRODUCT ----------
    const earningsRawProducts = await prisma.order.findMany({
      where: { product: { vendorId } },
      select: { productId: true, amountCents: true },
    });

    const earningsByProductMap: Record<string, number> = {};
    for (const row of earningsRawProducts) {
      earningsByProductMap[row.productId] =
        (earningsByProductMap[row.productId] ?? 0) + row.amountCents;
    }

    const earningsByProduct = Object.entries(earningsByProductMap)
      .map(([productId, sum]) => ({ productId, sum }))
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 5);

    data = {
      products,
      totalDownloads,
      downloadsLast30d,
      rawTotalEarnings,
      rawEarningsLast30d,
      pendingPayouts,
      availableBalance,
      earningsByDay,
      maxDaily,
      earningsByProduct,
      recentDownloads,
      downloadCounts,
    };
  } catch (err: any) {
    console.error("Dashboard Prisma error", err);
    const isP1001 =
      err?.code === "P1001" ||
      err?.message?.includes("P1001") ||
      err?.name === "PrismaClientKnownRequestError";
    if (isP1001) {
      return (
        <main className="page-shell-wide">
          <section className="neo-surface p-6 md:p-8 space-y-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
              Dein Verkäufer-Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Die Datenbank ist gerade nicht erreichbar (P1001).
              Bitte versuche es in ein paar Minuten erneut.
            </p>
          </section>
        </main>
      );
    }
    throw err;
  }

  const {
    products,
    totalDownloads,
    downloadsLast30d,
    rawTotalEarnings,
    rawEarningsLast30d,
    pendingPayouts,
    availableBalance,
    earningsByDay,
    maxDaily,
    earningsByProduct,
    recentDownloads,
    downloadCounts,
  } = data;

  return (
    <main className="page-shell-wide">
      <section
        className={`neo-surface p-6 md:p-8 space-y-8 ${styles.dashboardShell}`}
      >
        {/* HEADER */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
              Dein Verkäufer-Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Übersicht über Produkte, Verkäufe und Auszahlungen.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/new" className={styles.dashboardPrimaryLink}>
              Neues Produkt
            </Link>
          </div>
        </header>

        {/* KPI-CARDS */}
        <section className={styles.kpiSection}>
          <div className={styles.kpiGrid}>
            <KpiCard label="Produkte" value={products.length} />
            <KpiCard
              label="Downloads gesamt"
              value={totalDownloads}
              subLabel={`Letzte 30 Tage: ${downloadsLast30d}`}
            />
            <KpiCard
              label="Einnahmen (CHF)"
              value={(rawTotalEarnings / 100).toFixed(2)}
              subLabel={`Letzte 30 Tage: ${(rawEarningsLast30d / 100).toFixed(
                2
              )} CHF`}
            />
            <KpiCard
              label="Offene Auszahlungen"
              value={pendingPayouts}
              subLabel={`Verfügbar: ${(availableBalance / 100).toFixed(
                2
              )} CHF`}
            />
          </div>
        </section>

        {/* MINI EARNINGS CHART */}
        <section
          className={`${styles.statCard} ${styles.chartCard} rounded-3xl p-6 space-y-3`}
        >
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Einnahmen – Mini Chart (30 Tage)</span>
          </h2>

          <div className={styles.chartBody}>
            <div className="w-full h-32 flex items-end gap-[3px]">
              {earningsByDay.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  Noch keine Verkäufe in den letzten 30 Tagen.
                </p>
              )}

              {earningsByDay.map((d: any) => (
                <div
                  key={d.day}
                  className={styles.chartBar}
                  style={{
                    flex: 1,
                    height: `${(d.sum / maxDaily) * 100}%`,
                    background:
                      "linear-gradient(to top, rgba(34,197,94,0.9), rgba(59,130,246,0.9))",
                  }}
                  title={`${d.day}: ${(d.sum / 100).toFixed(2)} CHF`}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-[var(--color-text-muted)]">
            Letzte 30 Tage
          </p>
        </section>

        {/* EARNINGS PER PRODUCT */}
        <section className={`${styles.statCard} rounded-3xl p-6 space-y-4`}>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Top 5 – Umsatz pro Produkt</span>
          </h2>

          {earningsByProduct.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">
              Noch keine Verkäufe – sobald Produkte verkauft werden, erscheint
              hier deine Top-5-Liste.
            </p>
          ) : (
            <>
              <div className="flex items=end gap-4 h-48 px-2">
                {earningsByProduct.map((item: any) => {
                  const title =
                    products.find((p: any) => p.id === item.productId)
                      ?.title ?? "Produkt";
                  const amount = item.sum ?? 0;

                  return (
                    <div
                      key={item.productId}
                      className="flex-1 text-center transition-transform hover:scale-[1.02]"
                      >
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-emerald-400/80 via-blue-400/70 to-violet-400/70 shadow-[inset_0_0_6px_rgba(255,255,255,0.6)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all"
                        style={{
                          height: `${Math.min(amount / 150, 140)}px`,
                        }}
                      />
                      <div className="text-[10px] mt-2 truncate text-[var(--color-text-primary)] font-medium">
                        {title}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                        {(amount / 100).toFixed(2)} CHF
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                Umsatz basierend auf Verkäufen der letzten Monate
              </p>
            </>
          )}
        </section>

        {/* RECENT DOWNLOADS */}
        <section className={`${styles.statCard} rounded-3xl p-6`}> 
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Neueste Downloads</span>
          </h2>

          {recentDownloads.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] italic">
              Noch keine Downloads
            </p>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableScroll}>
                <table
                  className={styles.productsTable + " min-w-full text-xs"}
                >
                  <thead className="text-[var(--color-text-muted)] text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">
                        Produkt
                      </th>
                      <th className="py-3 px-4 text-left font-semibold">
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDownloads.map((d: any) => (
                      <tr
                        key={d.id}
                        className="border-t border-[var(--color-card-border)] hover:bg-[var(--color-surface)]/70 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 text-base">⬇</span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                              {d.order?.product?.title ?? "Unbekannt"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                            {new Date(d.createdAt).toLocaleString("de-CH")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* PRODUCTS TABLE */}
        <section className={`${styles.statCard} stats-card rounded-3xl p-6`}>
          <div className={styles.tableScrollWrapper}>
            <ProductsTable
              products={products}
              downloadCounts={downloadCounts}
            />
          </div>

          <p className={styles.tableScrollHint}>
            Tipp: Auf Mobilgeräten kannst du diese Tabelle seitlich scrollen.
          </p>
        </section>
      </section>
    </main>
  );
}

/* ---------------------- SUB COMPONENTS ---------------------- */

function KpiCard({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: number | string;
  subLabel?: string;
}) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {subLabel && <div className={styles.kpiSubLabel}>{subLabel}</div>}
    </div>
  );
}

function ProductsTable({
  products,
  downloadCounts,
}: {
  products: any[];
  downloadCounts: Record<string, number>;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
        <Package className="w-4 h-4 text-[var(--color-accent)]" />
        <span>Deine Produkte</span>
      </h2>
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table
            className={styles.productsTable + " min-w-full text-sm"}
            aria-label="Liste deiner Produkte"
          >
            <thead>
              <tr className="border-b border-[var(--color-card-border)]">
                <th className="py-3 px-4 text-left text-[11px] tracking-wide uppercase text-[var(--color-text-muted)]">
                  Titel
                </th>
                <th className="py-3 px-4 text-left text-[11px] tracking-wide uppercase text-[var(--color-text-muted)]">
                  Downloads
                </th>
                <th className="py-3 px-4 text-left text-[11px] tracking-wide uppercase text-[var(--color-text-muted)]">
                  Aktualisiert
                </th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-[var(--color-text-muted)]"
                  >
                    Noch keine Produkte
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr
                    key={product.id}
                    className="border-b border-[var(--color-card-border)] hover:bg-[var(--color-surface)]/70 transition-colors"
                  >
                    <td className="py-3 px-4 text-[var(--color-text-primary)]">
                      {product.title}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-[11px] font-medium
                        bg-emerald-100 text-emerald-700
                        dark:bg-emerald-500/20 dark:text-emerald-200
                        shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_1px_4px_rgba(0,0,0,0.06)]"
                      >
                        {downloadCounts[product.id] ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--color-text-muted)] text-[13px]">
                      {new Date(product.updatedAt).toLocaleDateString("de-CH")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/dashboard/products/${product.id}/edit-product`}
                          className="text-[11px] px-2 py-1 rounded-md
                          bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20
                          dark:bg-indigo-500/20 dark:text-indigo-200 dark:hover:bg-indigo-500/30
                          shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]
                          transition-all"
                        >
                          Bearbeiten
                        </Link>
                        <Link
                          href={`/product/${product.id}`}
                          className="text-[11px] px-2 py-1 rounded-md
                          bg-slate-400/10 text-[var(--color-text-muted)] hover:bg-slate-400/20
                          dark:bg-slate-500/20 dark:hover:bg-slate-500/30
                          shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]
                          transition-all"
                        >
                          Ansehen
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
