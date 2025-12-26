// src/app/marketplace/page.tsx
import Link from "next/link";
import crypto from "crypto";
import { getMarketplaceProducts, PAGE_SIZE } from "@/lib/products";
import { getBadgesForVendors } from "@/lib/trustBadges";
import BadgeRow from "@/components/marketplace/BadgeRow";
import styles from "./page.module.css";
import SellerLink from "@/components/seller/SellerLink";

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

type SearchParams = { [key: string]: string | string[] | undefined };
type MarketplacePageProps = { searchParams?: Promise<SearchParams> };

/**
 * ✅ Server-side Token-Signing für Thumbnail Proxy
 * - verhindert URL-Leaks (Firebase URLs tauchen nie im HTML auf)
 */
function signThumbUrl(productId: string, variant: "blur" | "full" = "blur") {
  const secret = (process.env.THUMB_TOKEN_SECRET ?? "").trim();
  const base = `/api/media/thumbnail/${encodeURIComponent(productId)}`;

  // Dev-friendly
  if (!secret) return `${base}?variant=${variant}`;

  const exp = Date.now() + 60 * 60 * 1000; // 60 Minuten
  const payload = `${productId}.${variant}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${base}?variant=${variant}&exp=${exp}&sig=${sig}`;
}

export default async function MarketplacePage(props: MarketplacePageProps) {
  const params: SearchParams = props.searchParams ? await props.searchParams : {};

  const pageParam = params.page;
  const categoryParam = params.category;
  const qParam = params.q;

  const resolvedPageParam =
    typeof pageParam === "string" ? pageParam : Array.isArray(pageParam) ? pageParam[0] : undefined;

  const resolvedCategoryParam =
    typeof categoryParam === "string"
      ? categoryParam
      : Array.isArray(categoryParam)
      ? categoryParam[0]
      : undefined;

  const resolvedSearchParam =
    typeof qParam === "string" ? qParam : Array.isArray(qParam) ? qParam[0] : "";

  const page =
    resolvedPageParam && !isNaN(Number(resolvedPageParam)) ? Math.max(1, Number(resolvedPageParam)) : 1;

  const category = resolvedCategoryParam && resolvedCategoryParam.length > 0 ? resolvedCategoryParam : "all";
  const search = resolvedSearchParam ?? "";

  const resolvedSortParam =
    typeof params.sort === "string" ? params.sort : Array.isArray(params.sort) ? params.sort[0] : undefined;

  const resolvedMinPriceParam =
    typeof params.minPrice === "string" ? params.minPrice : Array.isArray(params.minPrice) ? params.minPrice[0] : undefined;

  const resolvedMaxPriceParam =
    typeof params.maxPrice === "string" ? params.maxPrice : Array.isArray(params.maxPrice) ? params.maxPrice[0] : undefined;

  const sort = resolvedSortParam && resolvedSortParam.length > 0 ? resolvedSortParam : "newest";
  const minPrice = resolvedMinPriceParam ?? undefined;
  const maxPrice = resolvedMaxPriceParam ?? undefined;

  const parseCHFToCents = (v?: string | undefined): number | undefined => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    if (s.length === 0) return undefined;
    const n = Number(s);
    if (Number.isNaN(n)) return undefined;
    return Math.round(n * 100);
  };

  const minPriceCents = parseCHFToCents(minPrice as string | undefined);
  const maxPriceCents = parseCHFToCents(maxPrice as string | undefined);

  const { items: productsRaw, total: totalRaw, pageCount: pageCountRaw } = await getMarketplaceProducts({
    page,
    pageSize: PAGE_SIZE,
    category,
    search,
    sort: sort as any,
    minPriceCents,
    maxPriceCents,
  });

  const products = productsRaw ?? [];
  const total = typeof totalRaw === "number" ? totalRaw : products.length;
  const pageCount = typeof pageCountRaw === "number" && pageCountRaw > 0 ? pageCountRaw : 1;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  const baseQuery = (extra: { page?: number; category?: string; q?: string; sort?: string; minPrice?: string; maxPrice?: string }) => {
    const query: Record<string, string> = {};

    const categoryToUse = extra.category !== undefined ? extra.category : category;
    if (categoryToUse && categoryToUse !== "all") query.category = categoryToUse;

    const searchToUse = extra.q !== undefined ? extra.q : search;
    if (searchToUse && searchToUse.trim().length > 0) query.q = searchToUse.trim();

    if (extra.page !== undefined) query.page = String(extra.page);

    const sortToUse = extra.sort !== undefined ? extra.sort : sort;
    if (sortToUse && String(sortToUse).length > 0 && sortToUse !== "newest") query.sort = String(sortToUse);

    const minToUse = extra.minPrice !== undefined ? extra.minPrice : (minPrice as any);
    if (minToUse !== undefined && String(minToUse).trim().length > 0) query.minPrice = String(minToUse);

    const maxToUse = extra.maxPrice !== undefined ? extra.maxPrice : (maxPrice as any);
    if (maxToUse !== undefined && String(maxToUse).trim().length > 0) query.maxPrice = String(maxToUse);

    return query;
  };

  // Prepare badges for visible vendors (map vendorId -> vendorProfile)
  const vendorProfilesMap: Record<string, any> = {};
  for (const p of products) {
    if (!p.vendorId) continue;
    vendorProfilesMap[p.vendorId] = p.vendorProfile ?? null;
  }

  const badgesMap = await getBadgesForVendors(vendorProfilesMap);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Digital Marketplace</p>
            <h1 className={styles.title}>Marketplace</h1>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              ✔ Verifizierte Verkäufer · ✔ Sichere Zahlungen · ✔ Sofortiger Download
            </div>
            <p className={styles.subtitle}>
              Digitale Produkte für Creator &amp; Coaches – sicher bezahlen und sofort herunterladen.
            </p>
          </div>

          <form className={styles.searchBar} action="/marketplace">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            {sort && sort !== "newest" && <input type="hidden" name="sort" value={String(sort)} />}
            {minPrice !== undefined && <input type="hidden" name="minPrice" value={String(minPrice)} />}
            {maxPrice !== undefined && <input type="hidden" name="maxPrice" value={String(maxPrice)} />}
            <input className={styles.searchInput} type="text" name="q" placeholder="Suche nach Titel oder Beschreibung …" defaultValue={search} />
            <button className={styles.searchButton} type="submit">Suchen</button>
          </form>
        </header>

        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Kategorien</span>
          <div className={styles.filterChips}>
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = category === cat.key;
              return (
                <Link
                  key={cat.key}
                  href={{ pathname: "/marketplace", query: baseQuery({ category: cat.key, page: 1 }) }}
                  className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>

        <form className={styles.controlsRow} action="/marketplace">
          {category !== "all" && <input type="hidden" name="category" value={category} />}
          {search && search.trim().length > 0 && <input type="hidden" name="q" value={search} />}

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="sort">Sortieren</label>
            <select id="sort" name="sort" defaultValue={String(sort)} className={styles.controlSelect}>
              <option value="newest">Neueste</option>
              <option value="price_asc">Preis aufsteigend</option>
              <option value="price_desc">Preis absteigend</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="minPrice">Min CHF</label>
            <input id="minPrice" name="minPrice" type="number" step="0.5" placeholder="Min CHF" defaultValue={minPrice ?? ""} className={styles.controlInput} />
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="maxPrice">Max CHF</label>
            <input id="maxPrice" name="maxPrice" type="number" step="0.5" placeholder="Max CHF" defaultValue={maxPrice ?? ""} className={styles.controlInput} />
          </div>

          <div>
            <button type="submit" className={styles.searchButton}>Anwenden</button>
          </div>
        </form>

        {total === 0 && (
          <div className={styles.emptyState}>Keine Produkte gefunden – passe deine Suche oder Kategorie an.</div>
        )}

        {products.length > 0 && (
          <section className={styles.gridSection}>
            <div className={styles.grid}>
              {products.map((p: any) => {
                const price = typeof p.priceCents === "number" ? (p.priceCents / 100).toFixed(2) : "0.00";

                const hasThumb = typeof p.thumbnail === "string" && p.thumbnail.trim().length > 0;
                const thumbSrc = hasThumb ? signThumbUrl(p.id, "blur") : null;

                const vendorProfile = p.vendorProfile ?? null;
                const rawSellerName =
                  (vendorProfile?.displayName as string | undefined) ||
                  (vendorProfile?.user?.name as string | undefined) ||
                  "Verkäufer";
                const sellerName = (rawSellerName || "Verkäufer").trim() || "Verkäufer";
                const avatarUrl: string | undefined = vendorProfile?.avatarUrl ?? undefined;

                const isPublic = vendorProfile?.isPublic === true;
                const vendorProfileId: string | null = vendorProfile?.id ?? null;

                return (
                  <article key={p.id} className={styles.card}>
                    <Link href={`/product/${p.id}`} className={styles.cardBody}>
                      <div className={styles.cardImageWrapper}>
                        {thumbSrc ? (
                          // ✅ bewusst <img> (kein Next/Image localPatterns Ärger + Querystrings ok)
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbSrc}
                            alt={p.title}
                            className={`${styles.cardImage} ${styles.cardImageBlur}`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={styles.cardImagePlaceholder}>
                            <span className={styles.cardImageIcon}>💾</span>
                            <span className={styles.cardImageLabel}>Digitales Produkt</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardTagRow}>
                        <span className={styles.cardTag}>Digital</span>
                        {p.category && <span className={styles.cardTagSoft}>{p.category}</span>}
                      </div>

                      <h2 className={styles.cardTitle}>{p.title}</h2>
                      {p.description && <p className={styles.cardDescription}>{p.description}</p>}
                    </Link>

                    <div
                      className={styles.cardSeller}
                      style={{
                        margin: "0 1.2rem 0.5rem 1.2rem",
                        padding: "7px 0 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        opacity: 0.85,
                      }}
                    >
                      <span style={{ opacity: 0.7 }}>Verkauft von</span>

                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#f3f6fa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                        aria-hidden="true"
                      >
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span>{sellerName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {isPublic && vendorProfileId ? (
                        <SellerLink vendorProfileId={vendorProfileId} productId={p.id} source="marketplace_card" className="neo-link">
                          {sellerName}
                        </SellerLink>
                      ) : (
                        <span style={{ fontWeight: 700 }}>
                          {sellerName} <span style={{ fontSize: 11, opacity: 0.6 }}>(Profil privat)</span>
                        </span>
                      )}
                      {/* Badges (max 2) */}
                      <BadgeRow badges={badgesMap[p.vendorId] ?? []} max={2} />
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.priceBlock}>
                        <span className={styles.cardPrice}>CHF {price}</span>
                        <span className={styles.cardPriceHint}>Einmal zahlen · sofort laden</span>
                      </div>
                      <Link href={`/product/${p.id}`} className={styles.cardButton}>
                        Kaufen
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {pageCount > 1 && (
          <nav className={styles.pagination} aria-label="Seiten">
            <div className={styles.paginationInfo}>Seite {page} von {pageCount} · {total} Produkte</div>

            <div className={styles.paginationButtons}>
              {hasPrev ? (
                <Link href={{ pathname: "/marketplace", query: baseQuery({ page: page - 1 }) }} className={styles.pageButton}>
                  ← Zurück
                </Link>
              ) : (
                <span className={`${styles.pageButton} ${styles.pageButtonDisabled}`}>← Zurück</span>
              )}

              {hasNext ? (
                <Link href={{ pathname: "/marketplace", query: baseQuery({ page: page + 1 }) }} className={styles.pageButton}>
                  Weiter →
                </Link>
              ) : (
                <span className={`${styles.pageButton} ${styles.pageButtonDisabled}`}>Weiter →</span>
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
