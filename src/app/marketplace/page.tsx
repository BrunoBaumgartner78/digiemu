// src/app/marketplace/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getMarketplaceProducts, PAGE_SIZE } from "@/lib/products";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const CATEGORY_FILTERS = [
  { key: "all", label: "Alle" },
  { key: "ebook", label: "E-Books" },
  { key: "template", label: "Templates" },
  { key: "course", label: "Kurse" },
  { key: "audio", label: "Audio" },
  { key: "video", label: "Video" },
  { key: "coaching", label: "Coaching" },
  { key: "bundle", label: "Bundles" },
  { key: "other", label: "Sonstiges" },
];

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type MarketplacePageProps = {
  // Next 15/16: searchParams ist ein Promise
  searchParams?: Promise<SearchParams>;
};

export default async function MarketplacePage(props: MarketplacePageProps) {
  const params: SearchParams = props.searchParams
    ? await props.searchParams
    : {};

  const pageParam = params.page;
  const categoryParam = params.category;
  const qParam = params.q;

  const resolvedPageParam =
    typeof pageParam === "string"
      ? pageParam
      : Array.isArray(pageParam)
      ? pageParam[0]
      : undefined;

  const resolvedCategoryParam =
    typeof categoryParam === "string"
      ? categoryParam
      : Array.isArray(categoryParam)
      ? categoryParam[0]
      : undefined;

  const resolvedSearchParam =
    typeof qParam === "string"
      ? qParam
      : Array.isArray(qParam)
      ? qParam[0]
      : "";

  const page =
    resolvedPageParam && !isNaN(Number(resolvedPageParam))
      ? Math.max(1, Number(resolvedPageParam))
      : 1;

  const category =
    resolvedCategoryParam && resolvedCategoryParam.length > 0
      ? resolvedCategoryParam
      : "all";

  const search = resolvedSearchParam ?? "";

  const {
    items: productsRaw,
    total: totalRaw,
    pageCount: pageCountRaw,
  } = await getMarketplaceProducts({
    page,
    pageSize: PAGE_SIZE,
    category,
    search,
  });

  const products = productsRaw ?? [];
  const total = typeof totalRaw === "number" ? totalRaw : products.length;
  const pageCount =
    typeof pageCountRaw === "number" && pageCountRaw > 0 ? pageCountRaw : 1;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  /**
   * Baut die Query-Params für Links (Pagination + Filter)
   * - Kategorie "all" entfernt den category-Parameter
   * - Suche bleibt erhalten, außer wir überschreiben sie explizit
   */
  const baseQuery = (extra: {
    page?: number;
    category?: string;
    q?: string;
  }) => {
    const query: Record<string, string> = {};

    // Kategorie: explizit aus extra, sonst aktuelle
    const categoryToUse =
      extra.category !== undefined ? extra.category : category;

    if (categoryToUse && categoryToUse !== "all") {
      query.category = categoryToUse;
    }

    // Suche: explizit aus extra, sonst aktuelle
    const searchToUse =
      extra.q !== undefined ? extra.q : search;

    if (searchToUse && searchToUse.trim().length > 0) {
      query.q = searchToUse.trim();
    }

    if (extra.page !== undefined) {
      query.page = String(extra.page);
    }

    return query;
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Digital Marketplace</p>
            <h1 className={styles.title}>Marketplace</h1>
            <p className={styles.subtitle}>
              Digitale Produkte für Creator &amp; Coaches – sicher bezahlen und
              sofort herunterladen.
            </p>
          </div>

          {/* Suche */}
          <form className={styles.searchBar} action="/marketplace">
            {/* aktuelle Kategorie mitgeben, damit Suche + Kategorie kombiniert bleiben */}
            {category !== "all" && (
              <input type="hidden" name="category" value={category} />
            )}
            <input
              className={styles.searchInput}
              type="text"
              name="q"
              placeholder="Suche nach Titel oder Beschreibung …"
              defaultValue={search}
            />
            <button className={styles.searchButton} type="submit">
              Suchen
            </button>
          </form>
        </header>

        {/* Filter / Kategorie-Pills */}
        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Kategorien</span>
          <div className={styles.filterChips}>
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = category === cat.key;
              return (
                <Link
                  key={cat.key}
                  href={{
                    pathname: "/marketplace",
                    query: baseQuery({
                      category: cat.key, // "all" wird von baseQuery korrekt entfernt
                      page: 1,
                    }),
                  }}
                  className={`${styles.filterChip} ${
                    isActive ? styles.filterChipActive : ""
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {total === 0 && (
          <div className={styles.emptyState}>
            Keine Produkte gefunden – passe deine Suche oder Kategorie an.
          </div>
        )}

        {/* Grid */}
        {products && products.length > 0 && (
          <section className={styles.gridSection}>
            <div className={styles.grid}>
              {products.map((p) => {
                const price =
                  typeof p.priceCents === "number"
                    ? (p.priceCents / 100).toFixed(2)
                    : "0.00";

                const hasRealThumbnail =
                  typeof p.thumbnail === "string" &&
                  p.thumbnail.trim().length > 0 &&
                  !p.thumbnail.includes("example.com");

                return (
                  <article key={p.id} className={styles.card}>
                    <Link
                      href={`/product/${p.id}`}
                      className={styles.cardBody}
                    >
                      <div className={styles.cardImageWrapper}>
                        {hasRealThumbnail ? (
                          <Image
                            src={p.thumbnail as string}
                            alt={p.title}
                            fill
                            className={styles.cardImage}
                            sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                          />
                        ) : (
                          <div className={styles.cardImagePlaceholder}>
                            <span className={styles.cardImageIcon}>💾</span>
                            <span className={styles.cardImageLabel}>
                              Digitales Produkt
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardTagRow}>
                        <span className={styles.cardTag}>Digital</span>
                        {p.category && (
                          <span className={styles.cardTagSoft}>
                            {p.category}
                          </span>
                        )}
                      </div>

                      <h2 className={styles.cardTitle}>{p.title}</h2>
                      {p.description && (
                        <p className={styles.cardDescription}>
                          {p.description}
                        </p>
                      )}
                    </Link>

                    <div className={styles.cardFooter}>
                      <div className={styles.priceBlock}>
                        <span className={styles.cardPrice}>CHF {price}</span>
                        <span className={styles.cardPriceHint}>
                          Einmal zahlen · sofort laden
                        </span>
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        className={styles.cardButton}
                      >
                        Kaufen
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <nav className={styles.pagination} aria-label="Seiten">
            <div className={styles.paginationInfo}>
              Seite {page} von {pageCount} · {total} Produkte
            </div>
            <div className={styles.paginationButtons}>
              {hasPrev ? (
                <Link
                  href={{
                    pathname: "/marketplace",
                    query: baseQuery({ page: page - 1 }),
                  }}
                  className={styles.pageButton}
                >
                  ← Zurück
                </Link>
              ) : (
                <span
                  className={`${styles.pageButton} ${styles.pageButtonDisabled}`}
                >
                  ← Zurück
                </span>
              )}

              {hasNext ? (
                <Link
                  href={{
                    pathname: "/marketplace",
                    query: baseQuery({ page: page + 1 }),
                  }}
                  className={styles.pageButton}
                >
                  Weiter →
                </Link>
              ) : (
                <span
                  className={`${styles.pageButton} ${styles.pageButtonDisabled}`}
                >
                  Weiter →
                </span>
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
