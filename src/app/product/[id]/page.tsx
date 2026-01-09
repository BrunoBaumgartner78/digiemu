// src/app/product/[id]/page.tsx
import Link from "next/link";
import crypto from "crypto";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { marketplaceTenant } from "@/lib/marketplaceTenant";
import { ProductStatus, VendorStatus } from "@prisma/client";

import LikeButtonClient from "@/components/product/LikeButtonClient";
import BuyButtonClient from "@/components/checkout/BuyButtonClient";
import ProductViewTracker from "@/components/analytics/ProductViewTracker";
import BadgeRow from "@/components/marketplace/BadgeRow";
import { getBadgesForVendors } from "@/lib/trustBadges";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

// ✅ Next 16.1: params ist Promise
type ProductPageProps = { params: Promise<{ id: string }> };

function signThumbUrl(productId: string, variant: "blur" | "full" = "full") {
  const secret = (process.env.THUMB_TOKEN_SECRET ?? "").trim();
  const base = `/api/media/thumbnail/${encodeURIComponent(productId)}`;
  if (!secret) return `${base}?variant=${variant}`;

  const exp = Date.now() + 60 * 60 * 1000;
  const payload = `${productId}.${variant}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${base}?variant=${variant}&exp=${exp}&sig=${sig}`;
}

export default async function ProductPage({ params }: ProductPageProps) {
  // ✅ unwrap
  const { id } = await params;
  const pid = String(id ?? "").trim();
  if (!pid) notFound();

  const mp = marketplaceTenant();
  const tenantKeys = Array.from(new Set([mp.key, ...(mp.fallbackKeys ?? []), "DEFAULT"]));

  const session = await getServerSession(auth);
  const userId = ((session?.user as any)?.id as string | undefined) ?? null;
  const role = ((session?.user as any)?.role as string | undefined) ?? null;
  const isAdmin = role === "ADMIN";

  // 1) Produkt locker laden
  let p: any = null;
  try {
    p = await prisma.product.findFirst({
      where: {
        id: pid,
        tenantKey: { in: tenantKeys },
      },
      select: {
        id: true,
        tenantKey: true,
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
            tenantKey: true,
            isPublic: true,
            status: true,
            slug: true,
            displayName: true,
            avatarUrl: true,
            bannerUrl: true,
            totalSales: true,
            refundsCount: true,
            activeProductsCount: true,
            user: { select: { name: true } },
          },
        },

        _count: { select: { likes: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : undefined,
      },
    });
  } catch (err) {
    console.error("product/findFirst error:", err);
    notFound();
  }

  if (!p) notFound();

  // 2) VendorProfile fallback (legacy)
  const vendorProfile =
    p.vendorProfile ??
    (await prisma.vendorProfile.findFirst({
      where: {
        tenantKey: { in: tenantKeys },
        userId: p.vendorId,
      },
      select: {
        id: true,
        userId: true,
        tenantKey: true,
        isPublic: true,
        status: true,
        slug: true,
        displayName: true,
        avatarUrl: true,
        bannerUrl: true,
        totalSales: true,
        refundsCount: true,
        activeProductsCount: true,
        user: { select: { name: true } },
      },
    }));

  // 3) Visibility
  const isOwner = !!userId && userId === p.vendorId;
  const canBypassVisibility = isAdmin || isOwner;

  if (!canBypassVisibility) {
    const vpOk = !!vendorProfile && vendorProfile.isPublic === true && vendorProfile.status === VendorStatus.APPROVED;
    const vendorOk = p.vendor?.isBlocked !== true;

    // ✅ Detailseite darf ACTIVE + APPROVED anzeigen
    const productOk =
      p.isActive === true &&
      (p.status === ProductStatus.ACTIVE || p.status === ProductStatus.APPROVED);

    if (!vpOk || !vendorOk || !productOk) notFound();
  }

  const badgesMap = await getBadgesForVendors({ [p.vendorId]: vendorProfile ?? {} });
  const badgesForVendor = badgesMap[p.vendorId] ?? [];

  // Related products (public only)
  const relatedProducts = await prisma.product.findMany({
    where: {
      tenantKey: { in: tenantKeys },
      id: { not: p.id },
      isActive: true,
      status: ProductStatus.ACTIVE,
      vendor: { is: { isBlocked: false } },
      vendorProfile: { is: { isPublic: true, status: VendorStatus.APPROVED } },
      OR: [
        ...(p.vendorProfileId ? [{ vendorProfileId: p.vendorProfileId }] : []),
        { vendorId: p.vendorId },
      ],
    },
    select: { id: true, title: true, priceCents: true, thumbnail: true, category: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const price = (p.priceCents ?? 0) / 100;
  const hasThumb = typeof p.thumbnail === "string" && p.thumbnail.trim().length > 0;

  // 4) Full thumb rules
  let canFull = isAdmin || isOwner;

  if (!canFull && userId) {
    const buyerOrder = await prisma.order.findFirst({
      where: {
        tenantKey: p.tenantKey,
        buyerId: userId,
        productId: pid,
        status: { in: ["PAID", "paid", "COMPLETED", "completed"] },
      },
      select: { id: true },
    });
    if (buyerOrder) canFull = true;
  }

  const thumbSrc = hasThumb ? signThumbUrl(p.id, canFull ? "full" : "blur") : null;

  const likesCount = p._count?.likes ?? 0;
  const initialIsLiked = !!userId && (p.likes?.length ?? 0) > 0;

  const sellerName =
    vendorProfile?.displayName ||
    vendorProfile?.user?.name ||
    p.vendor?.name ||
    "Verkäufer";

  const sellerHref =
    vendorProfile?.isPublic === true && vendorProfile?.id
      ? `/seller/${encodeURIComponent(vendorProfile.id)}`
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <main className={styles.layout}>
          <ProductViewTracker productId={p.id} />

          <section className={styles.mediaCard}>
            {thumbSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbSrc}
                alt={p.title}
                className={styles.mediaImage}
                loading="eager"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.mediaPlaceholder}>💾</div>
            )}
          </section>

          <section className={styles.buyCard}>
            <h1 className={`${styles.title} textSafe`}>{p.title}</h1>

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
                  {vendorProfile.status !== VendorStatus.APPROVED && (
                    <span style={{ fontSize: 12, opacity: 0.65 }}>(Status: {vendorProfile.status})</span>
                  )}
                </div>

                <div style={{ marginTop: 8 }}>
                  <BadgeRow badges={badgesForVendor} max={3} />
                </div>
              </section>
            )}

            <p className={styles.priceLine}>CHF {price.toFixed(2)}</p>

            {/* Kaufen bleibt ACTIVE-only */}
            {p.isActive && p.status === ProductStatus.ACTIVE ? (
              <BuyButtonClient productId={p.id} />
            ) : (
              <div className="neo-card" style={{ padding: 12, marginTop: 10, opacity: 0.85 }}>
                <strong>Vorschau</strong> – Dieses Produkt ist noch nicht kaufbar (Status: {p.status}).
              </div>
            )}

            <LikeButtonClient
              productId={p.id}
              initialLikesCount={likesCount}
              initialIsLiked={initialIsLiked}
            />
          </section>
        </main>

        {p.description?.trim() ? (
          <section className={styles.descriptionSection}>
            <h2>Beschreibung</h2>
            <p className="textSafe textPreserve">{p.description}</p>
          </section>
        ) : null}

        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2>Mehr Produkte dieses Anbieters</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((rp: any) => (
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
            ← Zum Content OS
          </Link>
        </div>
      </div>
    </div>
  );
}
