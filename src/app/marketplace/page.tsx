// src/app/marketplace/page.tsx
import Link from "next/link";
import crypto from "crypto";
import { getMarketplaceProducts, PAGE_SIZE } from "@/lib/products";
import { getBadgesForVendors } from "@/lib/trustBadges";
import BadgeRow from "@/components/marketplace/BadgeRow";
import styles from "./page.module.css";
import SellerLink from "@/components/seller/SellerLink";
import { marketplaceTenant } from "@/lib/marketplaceTenant";
import { ProductStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function signThumbUrl(productId: string, variant: "blur" | "full" = "full") {
  const secret = (process.env.THUMB_TOKEN_SECRET ?? "").trim();
  const base = `/api/media/thumbnail/${encodeURIComponent(productId)}`;
  if (!secret) return `${base}?variant=${variant}`;

  const exp = Date.now() + 60 * 60 * 1000;
  const payload = `${productId}.${variant}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${base}?variant=${variant}&exp=${exp}&sig=${sig}`;
}

type MarketplaceSearchParams = Record<string, string | string[] | undefined>;

function spGet(sp: MarketplaceSearchParams, key: string): string {
  const v = sp[key];
  if (Array.isArray(v)) return (v[0] ?? "").trim();
  return (v ?? "").trim();
}

function toInt(v: string, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toCentsCHF(v: string): number | undefined {
  const s = v.replace(",", ".").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.round(n * 100));
}

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

function MarketplaceFilters({
  search,
  category,
  priceMode,
  sort,
  minCHF,
  maxCHF,
  total,
}: {
  search?: string | null;
  category?: string | null;
  priceMode?: string | null;
  sort?: string | null;
  minCHF?: string | null;
  maxCHF?: string | null;
  total: number;
}) {
  return (
    <section className="neo-card" style={{ padding: 14, marginBottom: 14, borderRadius: 8 }}>
      <form method="GET" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <input name="q" defaultValue={search ?? undefined} placeholder="Suche (Titel, Beschreibung)…" className="neo-input" style={{ width: "100%" }} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Kategorie</div>
            <select name="category" defaultValue={category ?? "all"} className="neo-input" style={{ width: "100%" }}>
              <option value="all">Alle</option>
              <option value="ebook">E-Book</option>
              <option value="template">Template</option>
              <option value="course">Kurs</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="coaching">Coaching</option>
              <option value="bundle">Bundle</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Preis</div>
            <select name="price" defaultValue={priceMode ?? "all"} className="neo-input" style={{ width: "100%" }}>
              <option value="all">Alle</option>
              <option value="free">Gratis</option>
              <option value="paid">Kostenpflichtig</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Sortierung</div>
            <select name="sort" defaultValue={sort ?? "newest"} className="neo-input" style={{ width: "100%" }}>
              <option value="newest">Neueste</option>
              <option value="price_asc">Preis ↑</option>
              <option value="price_desc">Preis ↓</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Min (CHF)</div>
            <input name="min" defaultValue={minCHF ?? undefined} inputMode="decimal" placeholder="0.00" className="neo-input" style={{ width: "100%" }} />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Max (CHF)</div>
            <input name="max" defaultValue={maxCHF ?? undefined} inputMode="decimal" placeholder="99.00" className="neo-input" style={{ width: "100%" }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="neobtn" style={{ width: "100%" }}>
              Filtern
            </button>
            <a href="/marketplace" className="neobtn neobtn-ghost" style={{ width: "100%", textAlign: "center" }}>
              Reset
            </a>
          </div>

          <input type="hidden" name="page" value="1" />
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>{total} Treffer</div>
      </form>
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams?: MarketplaceSearchParams | Promise<MarketplaceSearchParams> }) {
  const sp = (await (searchParams as Promise<MarketplaceSearchParams | undefined>)) ?? {};

  const page = Math.max(1, toInt(spGet(sp, "page"), 1));
  const category = spGet(sp, "category") || "all";
  const search = spGet(sp, "q") || "";
  const sort = spGet(sp, "sort") || "newest";
  const priceMode = spGet(sp, "price") || "all";
  const minCHF = spGet(sp, "min") || undefined;
  const maxCHF = spGet(sp, "max") || undefined;

  const minPriceCents = typeof minCHF === "string" ? toCentsCHF(minCHF) : undefined;
  const maxPriceCents = typeof maxCHF === "string" ? toCentsCHF(maxCHF) : undefined;

  // NOTE: Marketplace is platform-wide, not host/white-label scoped
  // Resolve the marketplace tenant via helper (allows ENV override)
  const mp = marketplaceTenant();

  const { items: products, total, pageCount } = await getMarketplaceProducts({
    tenantKeys: [mp.key, ...(mp.fallbackKeys ?? [])],
    page,
    pageSize: PAGE_SIZE,
    category: category === "all" ? undefined : category,
    search: search ? search : undefined,
    sort: sort as any,
    minPriceCents,
    maxPriceCents,
    // permissive fallback: accept common published-like product statuses (apply only to Product.status)
    acceptProductStatuses: [ProductStatus.ACTIVE], // ProductStatus.APPROVED omitted to avoid DB enum mismatch
  });

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  const baseQuery = (extra: Record<string, any> = {}) => {
    const q: Record<string, any> = {};
    if (category && category !== "all") q.category = category;
    if (search && String(search).trim().length > 0) q.q = String(search).trim();
    if (sort && String(sort) !== "newest") q.sort = String(sort);
    if (minCHF !== undefined && minCHF !== "") q.min = String(minCHF);
    if (maxCHF !== undefined && maxCHF !== "") q.max = String(maxCHF);
    return { ...q, ...extra };
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
      <MarketplaceFilters
        search={search}
        category={category}
        priceMode={priceMode}
        sort={sort}
        minCHF={minCHF}
        maxCHF={maxCHF}
        total={total}
      />

      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Digital Marketplace</p>
            <h1 className={styles.title}>Marketplace</h1>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              ✔ Verifizierte Verkäufer · ✔ Sichere Zahlungen · ✔ Sofortiger Download
            </div>
            <p className={styles.subtitle}>Digitale Produkte für Creator &amp; Coaches – sicher bezahlen und sofort herunterladen.</p>
          </div>

          <form className={styles.searchBar} action="/marketplace">
            {category !== "all" && <input type="hidden" name="category" value={category} />}
            {sort && sort !== "newest" && <input type="hidden" name="sort" value={String(sort)} />}
              {minCHF !== undefined && minCHF !== "" && <input type="hidden" name="min" value={String(minCHF)} />}
              {maxCHF !== undefined && maxCHF !== "" && <input type="hidden" name="max" value={String(maxCHF)} />}
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
            <label className={styles.controlLabel} htmlFor="sort">
              Sortieren
            </label>
            <select id="sort" name="sort" defaultValue={String(sort)} className={styles.controlSelect}>
              <option value="newest">Neueste</option>
              <option value="price_asc">Preis aufsteigend</option>
              <option value="price_desc">Preis absteigend</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="min">
                Min CHF
              </label>
              <input
                id="min"
                name="min"
                type="number"
                step="0.5"
                placeholder="Min CHF"
                defaultValue={minCHF ?? ""}
                className={styles.controlInput}
              />
          </div>

          <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="max">
                Max CHF
              </label>
              <input
                id="max"
                name="max"
                type="number"
                step="0.5"
                placeholder="Max CHF"
                defaultValue={maxCHF ?? ""}
                className={styles.controlInput}
              />
          </div>

          <div>
            <button type="submit" className={styles.searchButton}>
              Anwenden
            </button>
          </div>
        </form>

        {total === 0 && <div className={styles.emptyState}>Keine Produkte gefunden – passe deine Suche oder Kategorie an.</div>}

        {products.length > 0 && (
          <section className={styles.gridSection}>
            <div className={styles.grid}>
              {products.map((p: any) => {
                const price = typeof p.priceCents === "number" ? (p.priceCents / 100).toFixed(2) : "0.00";

                const hasThumb = typeof p.thumbnail === "string" && p.thumbnail.trim().length > 0;
                const thumbSrc = hasThumb ? signThumbUrl(p.id, "blur") : null;

                const vendorProfile = p.vendorProfile ?? null;

                const rawSellerName =
                  (vendorProfile?.displayName as string | undefined) || (vendorProfile?.user?.name as string | undefined) || "Verkäufer";
                const sellerName = (rawSellerName || "Verkäufer").trim() || "Verkäufer";
                const avatarUrl: string | undefined = vendorProfile?.avatarUrl ?? undefined;

                // ✅ Option B: Marketplace liefert nur APPROVED + public, trotzdem defensiv:
                const isPublic = vendorProfile?.isPublic === true;
                const isApproved = vendorProfile?.status === "APPROVED";
                const vendorProfileId: string | null = vendorProfile?.id ?? null;

                return (
                  <article key={p.id} className={styles.card}>
                    <Link href={`/product/${p.id}`} className={styles.cardBody}>
                      <div className={styles.cardImageWrapper}>
                        {thumbSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbSrc}
                            alt={p.title}
                            className={`${styles.cardImage} ${styles.cardImageBlur}`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            // onError removed (Server Components cannot pass event handlers)
                          />
                        ) : (
                          <div className={styles.cardImagePlaceholder}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/fallback-thumbnail.svg"
                              alt=""
                              className={styles.cardImage}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
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

                      {isPublic && isApproved && vendorProfileId ? (
                        <SellerLink vendorProfileId={vendorProfileId} productId={p.id} source="marketplace_card" className="neo-link">
                          {sellerName}
                        </SellerLink>
                      ) : (
                        <span style={{ fontWeight: 700 }}>
                          {sellerName} <span style={{ fontSize: 11, opacity: 0.6 }}>(nicht freigeschaltet)</span>
                        </span>
                      )}

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
            <div className={styles.paginationInfo}>
              Seite {page} von {pageCount} · {total} Produkte
            </div>

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
