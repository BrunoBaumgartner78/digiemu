// src/app/download/[orderId]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type DownloadPageProps = {
  // In Next.js 16 sind params/searchParams Promises
  params: Promise<{
    orderId: string;
  }>;
};

export default async function DownloadPage(props: DownloadPageProps) {
  // ✅ params sauber „awaiten“, sonst meckert Next (Promise-API)
  const { orderId } = await props.params;

  // --- 1. Param-Check ---
  if (!orderId) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <section className={`${styles.card} ${styles.cardWarning}`}>
            <h1 className={styles.title}>Bestell-ID fehlt</h1>
            <p className={styles.text}>
              Wir konnten diese Download-Seite nicht laden, weil keine gültige
              Bestell-ID übergeben wurde.
            </p>
            <div className={styles.actions}>
              <Link href="/marketplace" className="neobtn primary">
                Zum Marketplace
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // --- 2. Order aus der DB holen ---
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        select: { title: true },
      },
      downloadLink: true,
    },
  });

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <section className={`${styles.card} ${styles.cardWarning}`}>
            <h1 className={styles.title}>Bestellung nicht gefunden</h1>
            <p className={styles.text}>
              Wir konnten zu dieser ID keine Bestellung finden. Prüfe bitte den
              Link oder kontaktiere den Support, falls du den Kauf gerade
              abgeschlossen hast.
            </p>
            <div className={styles.actions}>
              <Link href="/marketplace" className="neobtn primary">
                Zurück zum Marketplace
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const productTitle = order.product?.title ?? "Dein digitales Produkt";
  const link = order.downloadLink;
  const now = new Date();

  const hasLink = !!link?.fileUrl;
  const isExpired =
    hasLink && link?.expiresAt && link.expiresAt.getTime() < now.getTime();

  // --- 3. Download-Ansicht ---
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.card}>
          <header className={styles.header}>
            <h1 className={styles.title}>Download für deine Bestellung</h1>
            <p className={styles.subtitle}>
              Produkt:&nbsp;
              <span className={styles.productName}>{productTitle}</span>
            </p>
          </header>

          <div className={styles.downloadBox}>
            {hasLink && !isExpired ? (
              <>
                <p className={styles.text}>
                  Hier kannst du dein digitales Produkt herunterladen. Bewahre
                  die Datei gut auf, der technische Zugang kann zeitlich
                  begrenzt sein.
                </p>
                <div className={styles.actions}>
                  {/* Direktlink zur Datei → neuer Tab */}
                  <a
                    href={link!.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neobtn primary"
                  >
                    Jetzt herunterladen
                  </a>

                  <Link href="/account/downloads" className="neobtn ghost">
                    Zu meinen Downloads
                  </Link>
                </div>
                <p className={styles.hint}>
                  Hinweis: Das gekaufte Produkt gehört dauerhaft dir. Der
                  Download-Link dient nur zur Bereitstellung der Datei.
                </p>
              </>
            ) : (
              <>
                <p className={styles.text}>
                  Für diese Bestellung ist aktuell kein aktiver Download-Link
                  verfügbar.
                </p>
                {isExpired ? (
                  <p className={styles.textMuted}>
                    Der technische Zugang zu deinem Download ist abgelaufen. Wenn
                    du trotzdem erneut Zugriff benötigst, wende dich bitte an
                    den Support und gib deine Bestell-ID an.
                  </p>
                ) : (
                  <p className={styles.textMuted}>
                    Es scheint, als wäre noch kein Download-Link generiert
                    worden. Warte einen Moment und lade die Seite neu oder
                    kontaktiere den Support.
                  </p>
                )}
                <div className={styles.actions}>
                  <Link href="/account/downloads" className="neobtn primary">
                    Zu meinen Downloads
                  </Link>
                  <Link href="/marketplace" className="neobtn ghost">
                    Zum Marketplace
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
