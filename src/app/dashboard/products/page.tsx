// src/app/dashboard/products/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
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
  searchParams?: Promise<SearchParams>;
};

export default async function ProductsOverviewPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") redirect("/login");

  const vendorId = user.id;

  const params: SearchParams = props.searchParams ? await props.searchParams : {};

  const rawStatus = params.status;
  const resolvedStatus =
    typeof rawStatus === "string" ? rawStatus : Array.isArray(rawStatus) ? rawStatus[0] : undefined;

  const statusFilter: "all" | "active" | "draft" | "blocked" =
    resolvedStatus && ["all", "active", "draft", "blocked"].includes(resolvedStatus)
      ? (resolvedStatus as any)
      : "all";

  const allProducts = await prisma.product.findMany({
    where: { vendorId, status: { not: ProductStatus.BLOCKED } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      thumbnail: true,
      isActive: true,
      status: true,
      updatedAt: true,
    },
  });

  const statusCounts = {
    all: allProducts.length,
    active: allProducts.filter((p) => p.isActive === true && p.status !== ProductStatus.BLOCKED).length,
    draft: allProducts.filter((p) => p.isActive === false || p.status === ProductStatus.DRAFT).length,
    blocked: allProducts.filter((p) => p.status === ProductStatus.BLOCKED).length,
  };

  let products = allProducts;

  if (statusFilter === "active") {
    products = allProducts.filter((p) => p.isActive === true && p.status !== ProductStatus.BLOCKED);
  } else if (statusFilter === "draft") {
    products = allProducts.filter((p) => p.isActive === false || p.status === ProductStatus.DRAFT);
  } else if (statusFilter === "blocked") {
    products = allProducts.filter((p) => p.status === ProductStatus.BLOCKED);
  }

  const downloads = await prisma.downloadLink.findMany({
    where: { order: { product: { vendorId } } },
    select: { order: { select: { productId: true } } },
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
        <header className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Deine Produkte</h1>
            <p className={styles.subtitle}>
              Verwalte hier alle deine digitalen Produkte – Status, Preis und Downloads auf einen Blick.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/dashboard/new" className={styles.primaryBtn}>
              Neues Produkt
            </Link>
          </div>
        </header>

        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>Status</span>
          <div className={styles.filterChips}>
            {STATUS_FILTERS.map((f) => {
              const isActiveFilter = statusFilter === f.key;
              const count = statusCounts[f.key as keyof typeof statusCounts] ?? 0;

              return (
                <Link
                  key={f.key}
                  href={{
                    pathname: "/dashboard/products",
                    query: f.key === "all" ? {} : { status: f.key },
                  }}
                  className={`${styles.filterChip} ${isActiveFilter ? styles.filterChipActive : ""}`}
                >
                  <span>{f.label}</span>
                  <span className={styles.filterChipBadge}>{count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {products.length === 0 && (
          <section className={styles.emptyWrapper}>
            <div className={styles.emptyCard}>
              <h2 className={styles.emptyTitle}>Keine Produkte</h2>
              <p className={styles.emptyText}>Lege dein erstes Produkt an und starte mit dem Verkauf.</p>
              <Link href="/dashboard/new" className={styles.emptyBtn}>
                Neues Produkt anlegen
              </Link>
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className={styles.grid}>
            {products.map((product) => {
              const price = product.priceCents / 100;
              const downloadsCount = downloadCounts[product.id] ?? 0;

              const isBlocked = product.status === ProductStatus.BLOCKED;
              const isPublished = product.isActive && !isBlocked;

              const desc = (product.description ?? "").trim();

              return (
                <article
                  key={product.id}
                  className={`${styles.card} dashboardProductCard`}
                >
                  <div className={styles.thumbWrapper}>
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} className={styles.thumbImage} />
                    ) : (
                      <div className={styles.thumbPlaceholder}>PDF</div>
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
                      {isPublished ? "Aktiv" : isBlocked ? "Blockiert" : "Entwurf"}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{product.title}</h2>

                    <p className={styles.cardDescription}>
                      {desc.length ? desc.slice(0, 120) : "Keine Beschreibung vorhanden."}
                    </p>

                    <div className={styles.metaRow}>
                      <span className={styles.metaStrong}>{price.toFixed(2)} CHF</span>
                      <span className={styles.metaMuted}>{downloadsCount} Downloads</span>
                    </div>
                  </div>

                  <div className={styles.actionsRow}>
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="neo-btn neo-btn-secondary"
                    >
                      Bearbeiten
                    </Link>

                    <Link href={`/product/${product.id}`} className={styles.ghostBtn}>
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
