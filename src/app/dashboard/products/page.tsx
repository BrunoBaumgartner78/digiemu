// src/app/dashboard/products/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./ProductsPage.module.css";

const STATUS_FILTERS = [
  { key: "all", label: "Alle" },
  { key: "active", label: "Aktiv" },
  { key: "draft", label: "Entwurf" },
  { key: "blocked", label: "Blockiert" },
];

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  // Next 15/16: searchParams ist ein Promise
  searchParams?: Promise<SearchParams>;
};

export default async function ProductsOverviewPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") redirect("/login");

  const vendorId = user.id;

  // 🔹 searchParams entpacken
  const params: SearchParams = props.searchParams
    ? await props.searchParams
    : {};

  const rawStatus = params.status;
  const resolvedStatus =
    typeof rawStatus === "string"
      ? rawStatus
      : Array.isArray(rawStatus)
      ? rawStatus[0]
      : undefined;

  const statusFilter: "all" | "active" | "draft" | "blocked" =
    resolvedStatus && ["all", "active", "draft", "blocked"].includes(resolvedStatus)
      ? (resolvedStatus as any)
      : "all";

  // 🔹 Alle Produkte des Vendors holen (für Filter + Counts)
  const allProducts = await prisma.product.findMany({
    where: { vendorId },
    orderBy: { updatedAt: "desc" },
  });

  // 🔢 Counts pro Status (auf Basis aller Produkte)
  const statusCounts = {
    all: allProducts.length,
    active: allProducts.filter(
      (p: any) => p.isActive === true && p.status !== "BLOCKED"
    ).length,
    draft: allProducts.filter(
      (p: any) => p.isActive === false || p.status === "DRAFT"
    ).length,
    blocked: allProducts.filter((p: any) => p.status === "BLOCKED").length,
  };

  // 🔹 Produkte entsprechend des Filters für die Liste auswählen
  let products = allProducts;

  if (statusFilter === "active") {
    products = allProducts.filter(
      (p: any) => p.isActive === true && p.status !== "BLOCKED"
    );
  } else if (statusFilter === "draft") {
    products = allProducts.filter(
      (p: any) => p.isActive === false || p.status === "DRAFT"
    );
  } else if (statusFilter === "blocked") {
    products = allProducts.filter((p: any) => p.status === "BLOCKED");
  }
  // "all" → keine zusätzliche Filterung

  // Download-Counts pro Produkt
  const downloads = await prisma.downloadLink.findMany({
    where: { order: { product: { vendorId } } },
    select: {
      order: { select: { productId: true } },
    },
  });

  const downloadCounts: Record<string, number> = {};
  for (const d of downloads) {
    const pid = d.order?.productId;
    if (!pid) continue;
    downloadCounts[pid] = (downloadCounts[pid] ?? 0) + 1;
  }

  return (
    <main className="page-shell-wide">
      <section className="neo-surface p-6 md:p-8 space-y-8">
        {/* Header */}
        <header className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Deine Produkte</h1>
            <p className={styles.subtitle}>
              Verwalte hier alle deine digitalen Produkte – Vorschau, Preis,
              Status und Downloads auf einen Blick.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/dashboard/products/top" className={styles.secondaryBtn}>
              Beliebteste Produkte
            </Link>
            <Link href="/dashboard/new" className={styles.primaryBtn}>
              Neues Produkt
            </Link>
          </div>
        </header>

        {/* 🔹 Status-Filter-Zeile mit Badges */}
        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Status</span>
          <div className={styles.filterChips}>
            {STATUS_FILTERS.map((f) => {
              const isActiveFilter = statusFilter === f.key;
              const count =
                statusCounts[f.key as keyof typeof statusCounts] ?? 0;

              return (
                <Link
                  key={f.key}
                  href={{
                    pathname: "/dashboard/products",
                    query:
                      f.key === "all"
                        ? {} // "Alle" → Query ohne status
                        : { status: f.key },
                  }}
                  className={`${styles.filterChip} ${
                    isActiveFilter ? styles.filterChipActive : ""
                  }`}
                >
                  <span className={styles.filterChipLabel}>{f.label}</span>
                  <span className={styles.filterChipBadge}>{count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <section className={styles.emptyWrapper}>
            <div className={styles.emptyCard}>
              <h2 className={styles.emptyTitle}>Keine Produkte im Filter</h2>
              <p className={styles.emptyText}>
                Unter diesem Status gibt es aktuell keine Produkte. Ändere den
                Filter oder lege ein neues Produkt an.
              </p>
              <Link href="/dashboard/new" className={styles.emptyBtn}>
                Neues Produkt anlegen
              </Link>
            </div>
          </section>
        )}

        {/* Grid mit Produkt-Karten */}
        {products.length > 0 && (
          <section className={styles.grid}>
            {products.map((product) => {
              const anyProd = product as any;
              const priceCents: number = anyProd.priceCents ?? 0;
              const price = priceCents / 100;

              const isBlocked = anyProd.status === "BLOCKED";
              const isPublished: boolean =
                anyProd.isActive === true && !isBlocked;

              const downloadsCount = downloadCounts[product.id] ?? 0;

              return (
                <article
                  key={product.id}
                  className={`${styles.card} dashboardProductCard`}
                >
                  {/* Thumbnail */}
                  <div className={styles.thumbWrapper}>
                    {anyProd.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={anyProd.thumbnail}
                        alt={product.title}
                        className={styles.thumbImage}
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <svg
                          width="80"
                          height="60"
                          className={styles.thumbIcon}
                        >
                          <rect
                            x="4"
                            y="4"
                            width="72"
                            height="52"
                            rx="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="56"
                            cy="18"
                            r="6"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            d="M18 48 L36 26 L58 48 Z"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                        </svg>
                      </div>
                    )}

                    <div
                      className={
                        isPublished
                          ? `${styles.statusPill} ${styles.statusLive}`
                          : isBlocked
                          ? `${styles.statusPill} ${styles.statusBlocked}`
                          : `${styles.statusPill} ${styles.statusDraft}`
                      }
                    >
                      {isPublished
                        ? "Aktiv"
                        : isBlocked
                        ? "Blockiert"
                        : "Entwurf"}
                    </div>
                  </div>

                  {/* Textblock */}
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{product.title}</h2>
                    <p className={styles.cardDescription}>
                      {product.description
                        ? product.description.slice(0, 120) +
                          (product.description.length > 120 ? " …" : "")
                        : "Noch keine Beschreibung hinterlegt."}
                    </p>

                    <div className={styles.metaRow}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Preis</span>
                        <span className={styles.metaValue}>
                          {price.toFixed(2)} CHF
                        </span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Downloads</span>
                        <span className={styles.metaValue}>
                          {downloadsCount}
                        </span>
                      </div>
                    </div>

                    <div className={styles.metaFoot}>
                      <span className={styles.metaDateLabel}>Aktualisiert</span>
                      <span className={styles.metaDate}>
                        {new Date(
                          product.updatedAt
                        ).toLocaleDateString("de-CH")}
                      </span>
                    </div>
                  </div>

                  {/* Aktionen */}
                  <div className={styles.actionsRow}>
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="neo-btn neo-btn-secondary"
                    >
                      Bearbeiten
                    </Link>

                    <Link
                      href={`/product/${product.id}`}
                      className={styles.ghostBtn}
                    >
                      Produkt ansehen
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
