// src/app/product/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductThumbUrl } from "@/lib/productThumb";
import LikeButtonClient from "@/components/product/LikeButtonClient";
import BuyButtonClient from "@/components/checkout/BuyButtonClient";
import CommentsClient from "@/components/product/CommentsClient";
import ReviewsClient from "@/components/product/ReviewsClient";
import ViewPing from "./ViewPing";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

// ✅ Next 16 guard: params MUST be Promise (no union)
type ProductPageProps = { params: Promise<{ id: string }> };

const SAFE_IMAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "lh3.googleusercontent.com",
  "images.pexels.com",
  "images.unsplash.com",
];

function canUseNextImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    const u = new URL(url);
    return SAFE_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params; // ✅ IMPORTANT (guard expects this pattern)
  const pid = String(id ?? "").trim();
  if (!pid) notFound();

  const p = await prisma.product.findFirst({
    where: { id: pid },
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      thumbnail: true,
      category: true,
      isActive: true,
      status: true,
      vendorId: true,
      vendorProfileId: true,
      vendor: { select: { name: true, isBlocked: true } },
      vendorProfile: {
        select: {
          id: true,
          userId: true,
          isPublic: true,
          slug: true,
          displayName: true,
          avatarUrl: true,
          bannerUrl: true,
          user: { select: { name: true } },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // ✅ REQUIRED by CI guard workflow (exact strings expected)
  if (!p || !p.isActive || p.status !== "ACTIVE") notFound();
  if (p.vendor?.isBlocked) notFound();

  const vendorProfile =
    p.vendorProfile ??
    (await prisma.vendorProfile.findUnique({
      where: { userId: p.vendorId },
      select: {
        id: true,
        userId: true,
        isPublic: true,
        slug: true,
        displayName: true,
        avatarUrl: true,
        bannerUrl: true,
        user: { select: { name: true } },
      },
    }));

  const relatedProducts = await prisma.product.findMany({
    where: {
      id: { not: p.id },
      isActive: true,
      status: "ACTIVE",
      vendor: { isBlocked: false }, // ✅ REQUIRED by CI guard workflow
      OR: [
        ...(p.vendorProfileId ? [{ vendorProfileId: p.vendorProfileId }] : []),
        { vendorId: p.vendorId },
      ],
    },
    select: { id: true, title: true, priceCents: true, thumbnail: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const price = (p.priceCents ?? 0) / 100;
  const productThumb = getProductThumbUrl({ thumbnailUrl: p.thumbnail });
  const hasThumb = typeof productThumb === "string" && productThumb.trim().length > 0;
  const showNextImage = hasThumb && canUseNextImage(productThumb);

  const likesCount = p._count?.likes ?? 0;
  const commentsCount = p._count?.comments ?? 0;

  const initialIsLiked = false;

  const sellerName =
    vendorProfile?.displayName ||
    vendorProfile?.user?.name ||
    p.vendor?.name ||
    "Verkäufer";

  const sellerHref =
    vendorProfile?.isPublic === true && vendorProfile.userId
      ? `/seller/${encodeURIComponent(vendorProfile.userId)}`
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <main className={styles.layout}>
          <ViewPing productId={p.id} />

          <section className={styles.mediaCard}>
            {showNextImage ? (
              <Image src={productThumb} alt={p.title} fill priority className={styles.mediaImage} />
            ) : hasThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productThumb} alt={p.title} className={styles.mediaImage} />
            ) : (
              <div className={styles.mediaPlaceholder}>
                <div className={styles.mediaIcon}>💾</div>
                <div className={styles.mediaPlaceholderText}>Kein Vorschaubild</div>
              </div>
            )}
          </section>

          <section className={styles.buyCard}>
            <h1 className={styles.title}>{p.title}</h1>

            {vendorProfile && (
              <section className="neo-card" style={{ padding: 14, marginTop: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, opacity: 0.7 }}>Verkauft von</span>

                  {sellerHref ? (
                    <Link href={sellerHref} className="neo-link" style={{ fontWeight: 800 }}>
                      {sellerName}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 800 }}>{sellerName}</span>
                  )}

                  {vendorProfile.isPublic === false && (
                    <span style={{ fontSize: 12, opacity: 0.65 }}>(Profil privat)</span>
                  )}
                </div>
              </section>
            )}

            <p className={styles.priceLine}>CHF {price.toFixed(2)}</p>

            <BuyButtonClient productId={p.id} />

            <LikeButtonClient productId={p.id} initialLikesCount={likesCount} initialIsLiked={initialIsLiked} />

            <div style={{ marginLeft: 12, fontSize: 14, opacity: 0.85 }}>
              💬 {commentsCount} Kommentar(e)
            </div>
          </section>
        </main>

        {p.description?.trim() ? (
          <section className={styles.descriptionSection}>
            <h2>Beschreibung</h2>
            <p className={styles["product-desc"]}>
              {String(p.description ?? "")
                .split("\n")
                .map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>
          </section>
        ) : null}

        <section className={styles.descriptionSection}>
          <ReviewsClient productId={p.id} />
        </section>

        <section className={styles.descriptionSection}>
          <CommentsClient productId={p.id} initialCount={commentsCount} />
        </section>

        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2>Mehr Produkte dieses Anbieters</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((rp) => (
                <Link key={rp.id} href={`/product/${rp.id}`} className={styles.relatedCard}>
                  <h3>{rp.title}</h3>
                  <span>CHF {(rp.priceCents / 100).toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ marginTop: 18 }}>
          <Link href="/marketplace" className="neobtn">
            ← Zum Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params; // ✅ IMPORTANT
  const pid = String(id ?? "").trim();
  if (!pid) return {};

  const p = await prisma.product.findUnique({
    where: { id: pid },
    select: { title: true, description: true, thumbnail: true },
  });
  if (!p) return {};

  const productThumb = getProductThumbUrl({ thumbnailUrl: p.thumbnail });

  const title = `${p.title} · Bellu`;
  const description = p.description
    ? p.description.length > 160
      ? p.description.slice(0, 157) + "…"
      : p.description
    : "Digitales Produkt auf Bellu";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: productThumb ? [{ url: productThumb, alt: p.title }] : undefined,
    },
    alternates: { canonical: `/product/${pid}` },
  } as unknown;
}
