// src/app/seller/[vendorId]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ vendorId: string }>;
};

const SAFE_IMAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "digiemu-49e69.firebasestorage.app", // ✅ FIX: Firebase "app" host
  "lh3.googleusercontent.com",
  "images.pexels.com",
  "images.unsplash.com",
];

// Robust url(...) value for inline styles
function toCssBg(url: string) {
  // Trim + encode spaces etc. (does not break already-encoded URLs)
  const safe = encodeURI(url.trim());
  return `url("${safe}")`;
}

function canUseNextImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const s = url.trim();
  if (!s) return false;
  // local images are always ok
  if (s.startsWith("/")) return true;

  try {
    const u = new URL(s);
    return SAFE_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

function formatCHF(cents: number) {
  const chf = (cents ?? 0) / 100;
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(chf);
}

export default async function SellerPage({ params }: Props) {
  const { vendorId } = await params;
  const key = decodeURIComponent(String(vendorId ?? "")).trim();
  if (!key) notFound();

  // slug ODER vendorProfile.id ODER vendorProfile.userId
  const profile = await prisma.vendorProfile.findFirst({
    where: { OR: [{ slug: key }, { id: key }, { userId: key }] },
    select: {
      id: true,
      userId: true,
      slug: true,
      isPublic: true,
      displayName: true,
      avatarUrl: true,
      bannerUrl: true,
      user: { select: { name: true, isBlocked: true } },
    },
  });

  if (!profile) notFound();
  if (profile.user?.isBlocked) notFound();
  if (profile.isPublic === false) notFound();

  const sellerName = profile.displayName || profile.user?.name || "Verkäufer";

  const products = await prisma.product.findMany({
    where: {
      vendorId: profile.userId,
      isActive: true,
      status: "ACTIVE",
      vendor: { isBlocked: false },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, priceCents: true, thumbnail: true, category: true },
    take: 24,
  });

  const avatarSrc = (profile.avatarUrl ?? "").trim();
  const bannerSrc = (profile.bannerUrl ?? "").trim();

  const avatarUseNext = canUseNextImage(avatarSrc);
  const bannerUseNext = canUseNextImage(bannerSrc);

  const initial = (sellerName || "V").trim().slice(0, 1).toUpperCase();

  return (
    <main className={styles.page}>
      {/* Banner */}
      <section className={styles.banner}>
        {bannerSrc ? (
          bannerUseNext ? (
            <div className={styles.bannerMedia}>
              <img
                src={bannerSrc}
                alt={`${sellerName} Banner`}
                className={styles.bannerImg}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div
              className={styles.bannerImgFallback}
              role="img"
              aria-label={`${sellerName} Banner`}
              style={{ backgroundImage: toCssBg(bannerSrc) }}
            />
          )
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}
      </section>

      {/* Header Card */}
      <section className={styles.headerCard}>
        <div className={styles.avatarWrap}>
          {avatarSrc ? (
            avatarUseNext ? (
              <img
                src={avatarSrc}
                alt={`${sellerName} Avatar`}
                width="84"
                height="84"
                style={{ objectFit: "cover", borderRadius: "999px" }}
              />
            ) : (
              <div
                className={styles.avatarImgFallback}
                role="img"
                aria-label={`${sellerName} Avatar`}
                style={{ backgroundImage: toCssBg(avatarSrc) }}
              />
            )
          ) : (
            <div className={styles.avatarFallback}>{initial}</div>
          )}
        </div>

        <div className={styles.headerText}>
          <div className={styles.kicker}>Verkäuferprofil</div>
          <h1 className={styles.name}>{sellerName}</h1>
          <div className={styles.sub}>
            {products.length} Produkt{products.length === 1 ? "" : "e"} verfügbar
          </div>

          <div className={styles.links}>
            <Link href="/marketplace" className="neobtn neobtn-ghost">
              ← Marketplace
            </Link>
            <Link href="/help" className="neobtn neobtn-ghost">
              Hilfe
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <h2>Produkte</h2>
          <p className={styles.productsSub}>Alle aktiven Produkte dieses Verkäufers</p>
        </div>

        {products.length === 0 ? (
          <div className={styles.privateCard}>Dieser Verkäufer hat aktuell keine aktiven Produkte.</div>
        ) : (
          <div className={styles.grid}>
            {products.map((p) => {
              const thumbSrc = (p.thumbnail ?? "").trim();
              const thumbUseNext = canUseNextImage(thumbSrc);

              return (
                <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>
                  <div className={styles.thumbWrap}>
                    {thumbSrc ? (
                      thumbUseNext ? (
                        <div className={styles.thumbMedia}>
                          <img
                            src={thumbSrc}
                            alt={p.title}
                            className={styles.thumbImg}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div
                          className={styles.thumbImgFallback}
                          role="img"
                          aria-label={p.title}
                          style={{ backgroundImage: toCssBg(thumbSrc) }}
                        />
                      )
                    ) : (
                      <div className={styles.thumbPlaceholder}>💾</div>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{p.title}</h3>

                    <div className={styles.meta}>
                      <span className={styles.cat}>
                        {p.category ? `Kategorie: ${p.category}` : "Kategorie: —"}
                      </span>
                      <span className={styles.price}>{formatCHF(p.priceCents)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
