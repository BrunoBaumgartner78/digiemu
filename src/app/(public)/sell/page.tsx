"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

function SellPageContent() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerStatus = (searchParams.get("status") || "").toUpperCase();
  const isPending = sellerStatus === "PENDING";
  const isBlocked = sellerStatus === "BLOCKED";
  const steps = [
    { label: "Antrag gesendet", hint: "Erfasst und bestätigt", done: true },
    { label: "Prüfung läuft", hint: "Dein Profil wird aktuell geprüft", done: true },
    { label: "Freigabe", hint: "Folgt nach erfolgreicher Prüfung", done: false },
  ];

  const handleOnboard = async () => {
    // Vendor role is granted only after admin approval.
    if (!session) {
      alert("Bitte melde dich zuerst an.");
      window.location.href = "/login?callbackUrl=/become-seller";
      return;
    }

    setLoading(true);
    setLoading(false);

    // Reuse the same server-side onboarding flow as /become-seller.
    router.push("/become-seller");
  };

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <section className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div>
              <span className={styles.eyebrow}>
                Seller-Antrag
              </span>

              <h1 className={styles.heroTitle}>Verkaufe deine digitalen Produkte auf Bellu</h1>
              <p className={styles.heroText}>
                Starte als Creator, baue dein Profil auf und schalte nach der Freigabe deine Verkäuferfunktionen frei.
                Bellu hält den Einstieg kompakt und transparent.
              </p>
            </div>

            {isPending ? (
              <section className={`${styles.statusCard} ${styles.pendingCard}`}>
                <div>
                  <div className={styles.statusTop}>
                    <span className={styles.pendingBadge}>
                      Pending
                    </span>
                    <span className={styles.statusMeta}>Prüfung läuft</span>
                  </div>

                  <h2 className={styles.statusTitle}>Antrag eingereicht</h2>
                  <p className={styles.statusText}>
                    Dein Verkäuferantrag wurde erfolgreich erfasst. Unser Team prüft dein Profil. Nach der Freigabe
                    erhältst du Zugriff auf die Verkäuferfunktionen. Bis zur Freigabe bleibst du technisch BUYER.
                  </p>
                  <p className={styles.statusText}>
                    Bis dahin kannst du weiterhin Produkte entdecken und dein Konto normal nutzen.
                  </p>
                </div>

                <div className={styles.stepsCard}>
                  <p className={styles.stepsLabel}>Nächste Schritte</p>
                  <div className={styles.stepsList}>
                    {steps.map((step, index) => (
                      <div key={step.label} className={styles.stepItem}>
                        <div
                          className={`${styles.stepBullet} ${step.done ? styles.stepBulletDone : styles.stepBulletTodo}`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className={styles.stepTitle}>{step.label}</div>
                          <div className={styles.stepHint}>{step.hint}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {isBlocked ? (
              <section className={`${styles.statusCard} ${styles.blockedCard}`}>
                <div className={styles.statusTop}>
                  <span className={styles.blockedBadge}>Blocked</span>
                  <span className={styles.statusMeta}>Freigabe pausiert</span>
                </div>
                <h2 className={styles.statusTitle}>Verkäuferprofil blockiert</h2>
                <p className={styles.statusText}>
                  Dein Verkäuferprofil ist aktuell blockiert. Bitte kontaktiere den Support, falls du Rückfragen hast.
                </p>
              </section>
            ) : null}

            {!sellerStatus ? (
              <section className={styles.infoCard}>
                <h2 className={styles.statusTitle}>Starte deinen Seller-Antrag</h2>
                <p className={styles.statusText}>
                  Reiche dein Profil ein und wir führen dich danach durch den Freigabeprozess. Sobald dein Antrag
                  bestätigt ist, erhältst du Zugriff auf die Verkäuferfunktionen.
                </p>
              </section>
            ) : null}

            <div className={styles.divider}>
              <div className={styles.actionsRow}>
                <div className={styles.actionsText}>
                  {isPending
                    ? "Antrag erfasst, Prüfung läuft, Freigabe folgt. Du kannst den Status jederzeit neu laden."
                    : isBlocked
                      ? "Dein Profil benötigt Klärung. Der Marketplace bleibt verfügbar, die Verkäuferfunktionen aktuell nicht."
                      : "Reiche deinen Antrag ein und wir leiten dich danach direkt in den Seller-Flow weiter."}
                </div>

                <div className={styles.actionsButtons}>
                  <button
                    onClick={handleOnboard}
                    disabled={loading || status === "loading"}
                    className={styles.primaryButton}
                  >
                    {loading ? "Wird eingerichtet..." : sellerStatus ? "Status aktualisieren" : "Verkäufer werden"}
                  </button>

                  <Link href="/marketplace" className={styles.secondaryButton}>
                    Produkte entdecken
                  </Link>
                </div>
              </div>

              <div>
                <Link href="/dashboard" className={styles.backLink}>
                  Zurück zum Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SellPageFallback() {
  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <section className={styles.heroCard}>
          <div className={styles.heroTop}>
            <span className={styles.eyebrow}>Seller-Antrag</span>
            <h1 className={styles.heroTitle}>Verkaufe deine digitalen Produkte auf Bellu</h1>
            <p className={styles.heroText}>Die Seite wird vorbereitet.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SellPage() {
  return <Suspense fallback={<SellPageFallback />}><SellPageContent /></Suspense>;
}
