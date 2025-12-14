// src/app/dashboard/vendor/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "../DashboardHome.module.css";

import { LineChart, BarChart2, Package } from "lucide-react";

export default async function VendorAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") redirect("/login");

  const vendorId = user.id;

  let data: any = {};
  try {
    // 1) Produkte des Vendors
    const products = await prisma.product.findMany({
      where: { vendorId },
      orderBy: { updatedAt: "desc" },
      // description kann existieren oder auch nicht – optional
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
      },
    });

    const productIds = products.map((p) => p.id);
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // 2) Views (ProductView)
    const allViews = await prisma.productView.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, createdAt: true },
    });

    const totalViews = allViews.length;
    const viewsLast30d = allViews.filter(
      (v) => v.createdAt >= thirtyDaysAgo
    ).length;

    const viewCounts: Record<string, number> = {};
    for (const v of allViews) {
      viewCounts[v.productId] = (viewCounts[v.productId] ?? 0) + 1;
    }

    // 3) Downloads
    const allDownloads = await prisma.downloadLink.findMany({
      where: { order: { product: { vendorId } } },
      select: {
        id: true,
        createdAt: true,
        order: { select: { productId: true } },
      },
    });

    const totalDownloads = allDownloads.length;
    const downloadsLast30d = allDownloads.filter(
      (d) => d.createdAt >= thirtyDaysAgo
    ).length;

    const downloadCounts: Record<string, number> = {};
    for (const d of allDownloads) {
      const pid = d.order?.productId;
      if (!pid) continue;
      downloadCounts[pid] = (downloadCounts[pid] ?? 0) + 1;
    }

    // 4) Umsatz / Orders
    const orders = await prisma.order.findMany({
      where: { product: { vendorId } },
      select: { productId: true, amountCents: true, createdAt: true },
    });

    let rawTotalRevenue = 0;
    let rawRevenueLast30d = 0;
    const earningsByProductMap: Record<string, number> = {};
    const earningsByDayMap: Record<string, number> = {};

    for (const o of orders) {
      rawTotalRevenue += o.amountCents;
      if (o.createdAt >= thirtyDaysAgo) {
        rawRevenueLast30d += o.amountCents;
      }

      // Umsatz pro Produkt
      earningsByProductMap[o.productId] =
        (earningsByProductMap[o.productId] ?? 0) + o.amountCents;

      // Umsatz pro Tag (für Verlauf)
      const day = o.createdAt.toISOString().slice(0, 10);
      earningsByDayMap[day] = (earningsByDayMap[day] ?? 0) + o.amountCents;
    }

    const earningsByDay = Object.entries(earningsByDayMap)
      .map(([day, sum]) => ({ day, sum }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const maxDaily = Math.max(
      earningsByDay.length ? Math.max(...earningsByDay.map((e) => e.sum)) : 0,
      1
    );

    // 5) Performance pro Produkt (Views, Downloads, Conversion, Umsatz)
    const performance = products.map((p) => {
      const views = viewCounts[p.id] ?? 0;
      const downloads = downloadCounts[p.id] ?? 0;
      const revenueCents = earningsByProductMap[p.id] ?? 0;

      const conversion =
        views > 0 ? (downloads / views) * 100 : downloads > 0 ? 100 : 0;

      return {
        id: p.id,
        title: p.title,
        views,
        downloads,
        revenueCents,
        conversion,
        updatedAt: p.updatedAt,
      };
    });

    performance.sort((a, b) => b.revenueCents - a.revenueCents);

    // 6) Funnel-Kennzahlen
    const totalImpressions = totalViews; // hier = Views
    const totalPurchases = totalDownloads;

    const viewRate = totalImpressions > 0 ? 100 : 0; // wenn Produkte existieren, sind Views = 100 %
    const purchaseRateFromViews =
      totalImpressions > 0
        ? (totalPurchases / totalImpressions) * 100
        : 0;
    const fullFunnelRate = purchaseRateFromViews;

    // 7) Keyword Explorer (aus Titeln/Beschreibungen)
    const stopWords = new Set([
      "und",
      "oder",
      "der",
      "die",
      "das",
      "ein",
      "eine",
      "mit",
      "für",
      "von",
      "in",
      "im",
      "am",
      "auf",
      "the",
      "and",
      "of",
      "zu",
      "ist",
      "sind",
    ]);

    const keywordMap: Record<
      string,
      { count: number; products: Set<string> }
    > = {};

    for (const p of products) {
      const text = `${p.title ?? ""} ${p.description ?? ""}`
        .toLowerCase()
        .replace(/[^\wäöüÄÖÜß]+/g, " ");

      const words = text
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length > 2 && !stopWords.has(w));

      const seenForProduct = new Set<string>();

      for (const w of words) {
        if (!w) continue;
        if (!keywordMap[w]) {
          keywordMap[w] = { count: 0, products: new Set() };
        }
        keywordMap[w].count += 1;
        if (!seenForProduct.has(w)) {
          keywordMap[w].products.add(p.id);
          seenForProduct.add(w);
        }
      }
    }

    const keywordExplorer = Object.entries(keywordMap)
      .map(([word, info]) => ({
        word,
        count: info.count,
        productCount: info.products.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 18);

    // 8) Low-Performance-Produkte
    const lowPerformance = performance.filter(
      (p) => p.views >= 5 && p.conversion < 5 && p.revenueCents < 1000
    );

    data = {
      totalViews,
      viewsLast30d,
      totalDownloads,
      downloadsLast30d,
      rawTotalRevenue,
      rawRevenueLast30d,
      earningsByDay,
      maxDaily,
      performance,
      viewRate,
      purchaseRateFromViews,
      fullFunnelRate,
      keywordExplorer,
      lowPerformance,
    };
  } catch (err: any) {
    console.error("Vendor Analytics Prisma error", err);
    const isP1001 =
      err?.code === "P1001" ||
      err?.message?.includes("P1001") ||
      err?.name === "PrismaClientKnownRequestError";

    if (isP1001) {
      return (
        <main className="page-shell-wide">
          <section className="neo-surface p-6 md:p-8 space-y-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
              Analytics-Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Die Datenbank ist gerade nicht erreichbar (P1001). Bitte
              versuche es in ein paar Minuten erneut.
            </p>
          </section>
        </main>
      );
    }

    throw err;
  }

  const {
    totalViews,
    viewsLast30d,
    totalDownloads,
    downloadsLast30d,
    rawTotalRevenue,
    rawRevenueLast30d,
    earningsByDay,
    maxDaily,
    performance,
    viewRate,
    purchaseRateFromViews,
    fullFunnelRate,
    keywordExplorer,
    lowPerformance,
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
              Analytics-Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
              Analyse deiner Produktperformance: Views, Downloads, Umsatz &
              Conversion – alles auf einen Blick.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className={styles.dashboardPrimaryLink}>
              Zur Verkäufer-Übersicht
            </Link>
          </div>
        </header>

        {/* GESAMT-FUNNEL */}
        <section className={styles.kpiSection}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Ansichten-Rate"
              value={`${viewRate.toFixed(1)} %`}
              subLabel="Seitenaufrufe deiner Produktseiten"
            />
            <KpiCard
              label="Kauf-Rate (von Views)"
              value={`${purchaseRateFromViews.toFixed(1)} %`}
              subLabel="Downloads je Seitenaufruf"
            />
            <KpiCard
              label="Full-Funnel (Impr → Kauf)"
              value={`${fullFunnelRate.toFixed(1)} %`}
              subLabel="Gesamt-Conversion deiner Produkte"
            />
          </div>
        </section>

        {/* CONVERSION VERLAUF */}
        <section
          className={`${styles.statCard} ${styles.chartCard} rounded-3xl p-6 space-y-3`}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <LineChart className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Umsatzentwicklung (30 Tage)</span>
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Basis: abgeschlossene Bestellungen der letzten 30 Tage
            </p>
          </div>

          <div className={styles.chartBody}>
            <div className="w-full h-40 flex items-end gap-[3px]">
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
        </section>

        {/* PERFORMANCE + KEYWORDS & LOW PERFORMANCE */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produkt-Performance */}
          <div className={`${styles.statCard} rounded-3xl p-6 space-y-4`}>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Produkt-Performance</span>
            </h2>

            {performance.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                Noch keine Daten – sobald Besucher deine Produktseiten
                aufrufen und Downloads stattfinden, erscheinen hier
                Auswertungen.
              </p>
            ) : (
              <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                  <table
                    className={styles.productsTable + " min-w-full text-xs"}
                    aria-label="Produkt-Performance"
                  >
                    <thead>
                      <tr className="border-b border-[var(--color-card-border)] text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                        <th className="py-3 px-4 text-left">Produkt</th>
                        <th className="py-3 px-4 text-right">Views</th>
                        <th className="py-3 px-4 text-right">Downloads</th>
                        <th className="py-3 px-4 text-right">Umsatz (CHF)</th>
                        <th className="py-3 px-4 text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map((p: any) => (
                        <tr
                          key={p.id}
                          className="border-b border-[var(--color-card-border)] hover:bg-[var(--color-surface)]/70 transition-colors"
                        >
                          <td className="py-3 px-4 text-[var(--color-text-primary)]">
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-[var(--color-accent)]" />
                              <span className="font-medium truncate max-w-[220px]">
                                {p.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px]">
                            {p.views}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px]">
                            {p.downloads}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px]">
                            {(p.revenueCents / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px]">
                            {p.conversion.toFixed(1)} %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className={styles.tableScrollHint}>
              Tipp: Du kannst diese Tabelle auf Mobilgeräten seitlich
              scrollen, um alle Spalten zu sehen.
            </p>
          </div>

          {/* Keyword Explorer + Low Performance */}
          <div className="space-y-6">
            {/* Keyword Explorer */}
            <div className={`${styles.statCard} rounded-3xl p-6 space-y-3`}>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Keyword Explorer
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Diese Begriffe kommen häufig in deinen Produkt-Titeln und
                Beschreibungen vor. Nutze relevante Keywords für bessere
                Sichtbarkeit.
              </p>

              {keywordExplorer.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  Noch keine Keywords – füge aussagekräftige Titel und
                  Beschreibungen zu deinen Produkten hinzu.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywordExplorer.map((k: { word: string; count: number; productCount: number }) => (
                    <span
                      key={k.word}
                      className="px-3 py-1 rounded-full text-[11px]
                      bg-[var(--color-surface)] text-[var(--color-text-primary)]
                      shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_1px_4px_rgba(15,23,42,0.25)]"
                    >
                      {k.word}{" "}
                      <span className="opacity-70">
                        ({k.productCount}× / {k.count})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Low Performance Produkte */}
            <div className={`${styles.statCard} rounded-3xl p-6 space-y-3`}>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Low Performance Produkte
              </h2>
              {lowPerformance.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  Aktuell keine Low-Performance-Produkte gefunden.
                </p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {lowPerformance.map((p: any) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[var(--color-surface)]/60"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate text-[var(--color-text-primary)]">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {p.views} Views · {p.downloads} Downloads ·{" "}
                          {p.conversion.toFixed(1)} % Conv.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
