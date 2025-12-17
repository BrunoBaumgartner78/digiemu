// src/app/product/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import LikeButtonClient from "@/components/product/LikeButtonClient";
import BuyButtonClient from "@/components/checkout/BuyButtonClient";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: { id: string } | Promise<{ id: string }> };

const SAFE_IMAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "lh3.googleusercontent.com",
  "images.pexels.com",
  "images.unsplash.com",
];

function canUseNextImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return SAFE_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await Promise.resolve(params);
  const pid = String(id ?? "").trim();
  if (!pid) notFound();

  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id ?? null;

  const p = await prisma.product.findUnique({
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
      vendor: { select: { name: true } },
      vendorProfile: {
        select: {
          id: true,
          isPublic: true,
          slug: true, // ✅ wichtig fürs öffentliche Profil
          displayName: true,
          avatarUrl: true,
          bannerUrl: true,
          user: { select: { name: true } },
        },
      },
      _count: { select: { likes: true } },
      likes: userId ? { where: { userId }, select: { id: true } } : undefined,
    },
  });

  if (!p || !p.isActive || p.status !== "ACTIVE") notFound();

  const vendorProfile =
    p.vendorProfile ??
    (await prisma.vendorProfile.findUnique({
      where: { userId: p.vendorId },
      select: {
        id: true,
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
  const showNextImage = canUseNextImage(p.thumbnail);
  const likesCount = p._count.likes ?? 0;
  const initialIsLiked = !!userId && (p.likes?.length ?? 0) > 0;

  const sellerName =
    vendorProfile?.displayName ||
    vendorProfile?.user?.name ||
    p.vendor?.name ||
    "Verkäufer";

  const sellerHref =
    vendorProfile?.isPublic && vendorProfile?.slug
      ? `/profile/${encodeURIComponent(vendorProfile.slug)}`
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <main className={styles.layout}>
          {/* Bild */}
          <section className={styles.mediaCard}>
            {showNextImage ? (
              <Image
                src={p.thumbnail as string}
                alt={p.title}
                fill
                priority
                className={styles.mediaImage}
              />
            ) : (
              <div className={styles.mediaPlaceholder}>💾</div>
            )}
          </section>

          {/* Kaufkarte */}
          <section className={styles.buyCard}>
            <h1 className={styles.title}>{p.title}</h1>

            {vendorProfile && (
              <section className="neo-card" style={{ padding: 14, marginTop: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, opacity: 0.7 }}>Verkauft von</span>

                  {sellerHref ? (
                    <Link href={sellerHref} className="neo-link" style={{ fontWeight: 700 }}>
                      {sellerName}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 700 }}>{sellerName}</span>
                  )}

                  {vendorProfile.isPublic === false && (
                    <span style={{ fontSize: 12, opacity: 0.65 }}>(Profil privat)</span>
                  )}
                </div>
              </section>
            )}

            <p className={styles.priceLine}>CHF {price.toFixed(2)}</p>

            <BuyButtonClient productId={p.id} />

            <LikeButtonClient
              productId={p.id}
              initialLikesCount={likesCount}
              initialIsLiked={initialIsLiked}
            />
          </section>
        </main>

        {/* Beschreibung */}
        {p.description && (
          <section className={styles.descriptionSection}>
            <h2>Beschreibung</h2>
            <p>{p.description}</p>
          </section>
        )}

        {/* Weitere Produkte */}
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
