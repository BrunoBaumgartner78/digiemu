// src/app/page.tsx
import Link from "next/link";
import styles from "./page.module.css";
import {
  getLandingStats,
  getTopProducts,
} from "@/lib/landingStats";

export const dynamic = "force-dynamic";

const chfCompact = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

const chfNormal = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function HomePage() {
  const [stats, topProducts] = await Promise.all([
    getLandingStats(),
    getTopProducts(3),
  ]);

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Digital Marketplace</p>
          <h1 className={styles.title}>
            We are a digital marketplace
            <br />
            for creators.
          </h1>
          <p className={styles.lead}>
            Verkaufe E-Books, Templates, Presets, Kurse und mehr – ohne
            technischen Stress. DigiEmu kümmert sich um Zahlung, Auslieferung
            und Statistik, du konzentrierst dich auf deine Inhalte.
          </p>

          <div className={styles.heroActions}>
            <Link href="/become-seller" className="neobtn primary">
              Verkäufer werden
            </Link>
            <Link href="/marketplace" className="neobtn">
              Produkte entdecken
            </Link>
          </div>
        </div>

        {/* Live Dashboard – dynamisch */}
        <aside className={styles.heroCard} aria-label="Live Dashboard">
          <p className={styles.cardLabel}>Live Dashboard</p>
          <div className={styles.kpiGrid}>
            <div className={styles.cardRow}>
              <p className={styles.cardCaption}>Heute</p>
              <p className={styles.cardValue}>
                {chfCompact.format(stats.todayTotal)}
              </p>
              <p className={styles.cardHint}>Direkte Verkäufe</p>
            </div>
            <div className={styles.cardRow}>
              <p className={styles.cardCaption}>Monat</p>
              <p className={styles.cardValue}>
                {chfCompact.format(stats.monthTotal)}
              </p>
              <p className={styles.cardHint}>Umsatz im aktuellen Monat</p>
            </div>
            <div className={styles.cardRow}>
              <p className={styles.cardCaption}>Creator</p>
              <p className={styles.cardValue}>{stats.activeCreators}</p>
              <p className={styles.cardHint}>Aktive Verkäufer:innen</p>
            </div>
          </div>
        </aside>
      </section>

      {/* BELIEBTE PRODUKTE – dynamisch */}
      <section className={styles.popularSection}>
        <header className={styles.popularHeader}>
          <p className={styles.eyebrow}>Beliebte Produkte</p>
          <h2 className={styles.sectionTitle}>
            Die meistverkauften digitalen Produkte der letzten 30 Tage.
          </h2>
        </header>

        {topProducts.length === 0 ? (
          <p className={styles.bodyText}>
            Noch keine Verkäufe – deine Produkte könnten hier stehen.
          </p>
        ) : (
          <div className={styles.productGrid}>
            {topProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className={styles.productCard}
              >
                <span className={styles.productType}>{p.type}</span>
                <h3 className={styles.productTitle}>{p.title}</h3>
                <p className={styles.productMeta}>
                  {chfNormal.format(p.monthlyRevenue)} Umsatz in 30 Tagen
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ABOUT / CLAIM */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutInner}>
          <h2 className={styles.sectionTitle}>
            DigiEmu – dein Marktplatz für digitale Produkte
          </h2>
          <p className={styles.bodyText}>
            DigiEmu ist ein kuratierter Multivendor-Marktplatz für digitale
            Produkte wie E-Books, Online-Kurse, Templates, Presets, Musik und
            mehr. Creator:innen verkaufen ihre Dateien direkt an Kund:innen,
            während DigiEmu sich um sichere Zahlungen, automatische Auslieferung
            und Reporting kümmert.
          </p>
          <p className={styles.bodyText}>
            Durch eine faire 80/20-Aufteilung, klare Bedingungen und
            transparente Statistiken behalten Creator:innen jederzeit den
            Überblick. DigiEmu reduziert technischen Stress und macht es
            einfach, digitale Produkte professionell zu vertreiben – vom ersten
            Upload bis zur Auszahlung.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} DigiEmu – Digital Marketplace for Creators
      </footer>
    </main>
  );
}
