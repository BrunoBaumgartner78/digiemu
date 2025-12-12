// src/app/download/success/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  // ✅ In Next 16 ist searchParams ein Promise → wir typisieren das so
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  // ✅ Promise auflösen, damit wir sauber damit arbeiten können
  const params = (await searchParams) ?? {};

  // session_id robust auslesen
  const rawSessionId = params.session_id;
  const sessionId =
    typeof rawSessionId === "string"
      ? rawSessionId
      : Array.isArray(rawSessionId)
      ? rawSessionId[0]
      : undefined;

  // Wenn keine session_id vorhanden ist → zurück zum Marketplace
  if (!sessionId) {
    return redirect("/marketplace");
  }

  // Bestellung zu dieser Stripe-Session holen
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      product: {
        select: {
          title: true,
        },
      },
      downloadLink: true,
    },
  });

  // Wenn wir gar keine Order finden → freundliche Meldung
  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <section
            className={`${styles.card} ${styles.cardWarning}`}
            aria-live="polite"
          >
            <h1 className={styles.title}>Bestellung nicht gefunden</h1>
            <p className={styles.text}>
              Wir konnten zu dieser Zahlungsbestätigung keine Bestellung
              zuordnen. Wenn du den Kauf gerade abgeschlossen hast, warte ein
              paar Sekunden und lade die Seite erneut. Falls das Problem
              bestehen bleibt, kontaktiere bitte den Support.
            </p>
            <div className={styles.actions}>
              <Link href="/marketplace" className="neobtn primary">
                Zurück zum Marketplace
              </Link>
              <Link href="/" className="neobtn ghost">
                Zur Startseite
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const productTitle = order.product?.title ?? "Dein digitales Produkt";
  const hasDownload = Boolean(order.downloadLink?.fileUrl);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.card} aria-live="polite">
          <header className={styles.header}>
            <span className={styles.badge}>Zahlung erfolgreich</span>
            <h1 className={styles.title}>Vielen Dank für deinen Kauf! 🎉</h1>
            <p className={styles.subtitle}>
              Deine Zahlung wurde erfolgreich verarbeitet. Unten findest du den
              Download für:
              <br />
              <span className={styles.productName}>{productTitle}</span>
            </p>
          </header>

          <div className={styles.downloadBox}>
            {hasDownload ? (
              <>
                <p className={styles.text}>
                  Dein Download ist bereit. Du kannst die Datei direkt
                  herunterladen oder später über die Download-Seite erneut
                  öffnen, solange der Zugang aktiv ist.
                </p>
                <div className={styles.actions}>
                  {/* Direkter Download zur Datei */}
                 <a
  href={order.downloadLink!.fileUrl}
  className="neobtn primary"
  target="_blank"
  rel="noopener noreferrer"
>
  Jetzt herunterladen
</a>


                  {/* Fallback auf /download/[orderId] */}
                  <Link
                    href={`/download/${order.id}`}
                    className="neobtn ghost"
                  >
                    Zur Download-Seite
                  </Link>
                </div>

                <p className={styles.hint}>
                  Hinweis: Der technische Zugang zu deinem Download kann zeitlich
                  begrenzt sein, das gekaufte Produkt gehört aber dauerhaft dir.
                </p>
              </>
            ) : (
              <>
                <p className={styles.text}>
                  Deine Zahlung ist eingegangen, der Download-Link wird gerade
                  erstellt. Das dauert normalerweise nur ein paar Sekunden.
                </p>
                <p className={styles.textMuted}>
                  Wenn nach einigen Sekunden noch kein Download erscheint, lade
                  die Seite bitte neu. Sollte das Problem bestehen bleiben,
                  kontaktiere den Support mit deiner Bestellnummer.
                </p>
                <div className={styles.actions}>
                  <Link
                    href={`/download/${order.id}`}
                    className="neobtn primary"
                  >
                    Download-Seite öffnen
                  </Link>
                  <Link href="/marketplace" className="neobtn ghost">
                    Zurück zum Marketplace
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
