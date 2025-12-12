// src/app/account/downloads/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AccountDownloadsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return redirect("/login?callbackUrl=/account/downloads");
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
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
        <header className={styles.header}>
          <h1 className={styles.title}>Meine Käufe &amp; Downloads</h1>
          <p className={styles.subtitle}>
            Hier findest du alle digitalen Produkte, die du über DigiEmu gekauft
            hast. Solange der Download nicht abgelaufen ist, kannst du die Datei
            jederzeit erneut herunterladen.
          </p>
        </header>

        {orders.length === 0 ? (
          <section className={styles.emptyBox}>
            <h2 className={styles.emptyTitle}>Noch keine Käufe</h2>
            <p className={styles.emptyText}>
              Du hast bisher noch keine digitalen Produkte gekauft. Stöbere im
              Marketplace und entdecke neue Inhalte.
            </p>
            <Link href="/marketplace" className="neobtn primary">
              Zum Marketplace
            </Link>
          </section>
        ) : (
          <section className={styles.listSection}>
            <ul className={styles.downloadList}>
              {orders.map((order) => {
                const link = order.downloadLink;
                const hasLink = !!link?.fileUrl;
                const isExpired =
                  hasLink &&
                  link?.expiresAt &&
                  link.expiresAt.getTime() < now.getTime();

                let statusLabel = "Bereit zum Download";
                let statusClass = styles.statusActive;

                if (!hasLink) {
                  statusLabel = "Wird erstellt";
                  statusClass = styles.statusPending;
                } else if (isExpired) {
                  statusLabel = "Download abgelaufen";
                  statusClass = styles.statusExpired;
                }

                const productTitle =
                  order.product?.title ?? "Digitales Produkt";

                return (
                  <li key={order.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      {/* Thumbnail / Placeholder */}
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


                      {/* Textbereich */}
                      <div className={styles.cardMain}>
                        <div className={styles.cardHeader}>
                          <div>
                            <h2 className={styles.productTitle}>
                              {productTitle}
                            </h2>
                            <p className={styles.orderMeta}>
                              Bestellnummer:{" "}
                              <span className={styles.code}>{order.id}</span> ·
                              &nbsp;gekauft am{" "}
                              {order.createdAt.toLocaleDateString("de-CH", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <span
                            className={`${styles.statusBadge} ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {order.product?.description && (
                          <p className={styles.description}>
                            {order.product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      {hasLink && !isExpired ? (
                        <>
                          {/* Direktdownload in neuem Tab */}
                          <a
                            href={link!.fileUrl}
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
                        <>
                          <span className={styles.infoText}>
                            {isExpired
                              ? "Der technische Zugang zu deinem Download ist abgelaufen. Kontaktiere den Support, wenn du erneut Zugriff benötigst."
                              : "Der Download-Link wird gerade erstellt. Versuche es gleich noch einmal oder lade die Seite neu."}
                          </span>
                          <Link
                            href="/marketplace"
                            className="neobtn ghost small"
                          >
                            Weiter stöbern
                          </Link>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
