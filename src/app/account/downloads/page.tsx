import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AccountDownloadsPage() {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect("/login?callbackUrl=/account/downloads");
  }

  const orders = await prisma.order.findMany({
    where: {
      buyerId: userId,
      status: "PAID",
    },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          title: true,
          description: true,
          thumbnail: true,
        },
      },
      downloadLink: true,
    },
  });

  const now = new Date();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header>
          <h1 className={styles.heading}>Meine Käufe & Downloads</h1>
          <p className={styles.subheading}>
            Hier findest du alle digitalen Produkte, die du gekauft hast.
          </p>
        </header>

        {orders.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>Noch keine Käufe</h2>
            <p className={styles.emptyText}>
              Du hast bisher noch keine digitalen Produkte gekauft.
            </p>
            <Link href="/marketplace" className="neobtn primary">
              Zum Marketplace
            </Link>
          </section>
        ) : (
          <ul className={styles.list}>
            {orders.map((order) => {
              const productTitle =
                order.product?.title ?? "Digitales Produkt";

              const link = order.downloadLink;
              const hasLink = Boolean(link?.fileUrl);
              const isExpired =
                hasLink &&
                link?.expiresAt &&
                link.expiresAt.getTime() < now.getTime();

              const isInactive = link?.isActive === false;

              const maxDownloads = link?.maxDownloads ?? 3;
              const downloadCount = link?.downloadCount ?? 0;
              const isLimitReached =
                hasLink && downloadCount >= maxDownloads;

              const canDownload =
                hasLink &&
                !isExpired &&
                !isInactive &&
                !isLimitReached;

              let statusLabel = "Bereit zum Download";
              let statusClass = styles.statusReady;

              if (!hasLink) {
                statusLabel = "Download wird erstellt";
                statusClass = styles.statusPending;
              } else if (isExpired || isInactive || isLimitReached) {
                statusLabel = "Nicht verfügbar";
                statusClass = styles.statusExpired;
              }

              return (
                <li key={order.id} className={styles.card}>
                  {/* Thumbnail */}
                  <div className={styles.thumbWrapper}>
                    {order.product?.thumbnail ? (
                      <img
                        src={order.product.thumbnail}
                        alt={productTitle}
                        className={styles.thumbImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <span className={styles.thumbInitials}>PDF</span>
                      </div>
                    )}
                  </div>

                  {/* Main */}
                  <div className={styles.cardMain}>
                    <h2 className={styles.productTitle}>
                      {productTitle}
                    </h2>

                    <p className={styles.orderMeta}>
                      <span>
                        Bestellnummer:
                        <span className={styles.code}> {order.id}</span>
                      </span>
                    </p>

                    <p className={styles.orderMeta}>
                      <span>
                        Gekauft am{" "}
                        {order.createdAt.toLocaleDateString("de-CH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </p>

                    {order.product?.description && (
                      <p className={styles.description}>
                        {order.product.description}
                      </p>
                    )}

                    {hasLink && (
                      <p className={styles.orderMeta}>
                        Downloads: {downloadCount}/{maxDownloads}
                      </p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className={styles.status}>
                    <span
                      className={`${styles.statusBadge} ${statusClass}`}
                    >
                      {statusLabel}
                    </span>

                    <div className={styles.actions}>
                      {canDownload ? (
                        <>
                          <a
                            href={`/api/download/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neobtn primary"
                          >
                            Jetzt herunterladen
                          </a>
                          <Link
                            href={`/download/${order.id}`}
                            className="neobtn ghost"
                          >
                            Zur Download-Seite
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/download/${order.id}`}
                          className="neobtn ghost"
                        >
                          Details ansehen
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
