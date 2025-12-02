// src/app/page.tsx
import styles from "./page.module.css";
import Link from "next/link";

export default function HomePage() {
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
            <Link href="/register-vendor" className={`neo-btn neo-btn-primary`}>
              Verkäufer werden
            </Link>
            <Link href="/marketplace" className={`neo-btn neo-btn-secondary`}>
              Produkte entdecken
            </Link>
          </div>
        </div>

        <aside className={`neo-card ${styles.heroCard}`}>
          <p className={styles.cardLabel}>Live Dashboard (Demo)</p>

          <div className={styles.cardRow}>
            <div>
              <p className={styles.cardCaption}>Heute</p>
              <p className={styles.cardValue}>CHF 240</p>
              <p className={styles.cardHint}>Direkte Verkäufe</p>
            </div>
          </div>

          <div className={styles.cardRow}>
            <div>
              <p className={styles.cardCaption}>Monat</p>
              <p className={styles.cardValue}>CHF 4&apos;320</p>
              <p className={styles.cardHint}>Wiederkehrende Umsätze</p>
            </div>
          </div>

          <div className={styles.cardRow}>
            <div>
              <p className={styles.cardCaption}>Creator</p>
              <p className={styles.cardValue}>128</p>
              <p className={styles.cardHint}>Aktive Verkäufer:innen</p>
            </div>
          </div>
        </aside>
      </section>

      {/* BELIEBTE PRODUKTE */}
      <section className={styles.popularSection}>
        <div className={styles.popularHeader}>
          <p className={styles.eyebrow}>Beliebte Produkte</p>
          <h2 className={styles.sectionTitle}>
            Die meistverkauften digitalen Produkte der letzten 30 Tage.
          </h2>
        </div>

        <div className={styles.productGrid}>
          <article className={`neo-card ${styles.productCard}`}>
            <p className={styles.productType}>Template</p>
            <h3 className={styles.productTitle}>Notion Budget Template</h3>
            <p className={styles.productMeta}>CHF 420 / Monat</p>
          </article>

          <article className={`neo-card ${styles.productCard}`}>
            <p className={styles.productType}>Preset</p>
            <h3 className={styles.productTitle}>Lightroom Preset Pack</h3>
            <p className={styles.productMeta}>CHF 380 / Monat</p>
          </article>

          <article className={`neo-card ${styles.productCard}`}>
            <p className={styles.productType}>E-Book</p>
            <h3 className={styles.productTitle}>eBook: Freelance Starter</h3>
            <p className={styles.productMeta}>CHF 350 / Monat</p>
          </article>

          <article className={`neo-card ${styles.productCard}`}>
            <p className={styles.productType}>Design</p>
            <h3 className={styles.productTitle}>Canva Social Kit</h3>
            <p className={styles.productMeta}>CHF 310 / Monat</p>
          </article>

          <article className={`neo-card ${styles.productCard}`}>
            <p className={styles.productType}>Kurs</p>
            <h3 className={styles.productTitle}>Mini-Kurs: Newsletter</h3>
            <p className={styles.productMeta}>CHF 270 / Monat</p>
          </article>

          <article className={`neo-card ${styles.productCard}`}>
            <p className={styles.productType}>UI Kit</p>
            <h3 className={styles.productTitle}>UI Kit für Figma</h3>
            <p className={styles.productMeta}>CHF 240 / Monat</p>
          </article>
        </div>
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

      <footer className={styles.footer}>
        © {new Date().getFullYear()} DigiEmu – Digital Marketplace for Creators
      </footer>
    </main>
  );
}
