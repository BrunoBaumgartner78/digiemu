import Link from "next/link";
import styles from "./mainFooter.module.css";
import { LEGAL } from "@/lib/legal";

type FooterLink = { label: string; href: string };

const LEGAL_LINKS: FooterLink[] = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "AGB", href: "/agb" },
];

const INFO: FooterLink[] = [
  { label: "Kontakt", href: "/contact" },
  { label: "About us", href: "/about" },
  { label: "About marketplace", href: "/about-marketplace" },
];

const QUICK: FooterLink[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Preise", href: "/preise" },
  { label: "Hilfe", href: "/help" },
];

export default function MainFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.wrap} aria-label="Footer">
      <div className={styles.container}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, marginBottom: 8 }}>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/help">Hilfe</Link>
        </div>
        <div className={styles.card}>
          <div className={styles.top}>
            {/* Brand */}
            <div className={styles.brand}>
              <div className={styles.logo} aria-hidden="true">
                D
              </div>
              <div>
                <div className={styles.kicker}>DIGIEMU</div>
                <div className={styles.title}>Digitaler Marktplatz</div>
                <p className={styles.tagline}>
                  Digitale Produkte von Creators – sicher kaufen, einfach verkaufen.
                </p>

                <div className={styles.quick}>
                  {QUICK.map((l) => (
                    <Link key={l.href} href={l.href} className={styles.pill}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Link Columns */}
            <div className={styles.cols}>
              <div className={styles.col}>
                <div className={styles.colTitle}>Rechtliches</div>
                <ul className={styles.list}>
                  {LEGAL_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={styles.link}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.col}>
                <div className={styles.colTitle}>Infos</div>
                <ul className={styles.list}>
                  {INFO.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={styles.link}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className={styles.bottom}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: "14px 10px", fontSize: 13, opacity: 0.9 }}>
              <span style={{ opacity: 0.7 }}>© {year} {LEGAL.companyName}</span>
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={styles.link}>
                  {l.label}
                </Link>
              ))}
              <Link href="/help" className={styles.link}>Hilfe</Link>
            </div>

            <div className={styles.meta}>
              <span className={styles.muted}>Support:</span>
              <a className={styles.mail} href={`mailto:${LEGAL.supportEmail}`}>
                {LEGAL.supportEmail}
              </a>
              <span className={styles.dot}>·</span>
              <span className={styles.muted}>Made with 🤍 in Switzerland</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
