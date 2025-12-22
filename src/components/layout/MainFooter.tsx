import Link from "next/link";
import styles from "./mainFooter.module.css";

type FooterLink = { label: string; href: string };

const LEGAL: FooterLink[] = [
  { label: "AGB", href: "/agb" },
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
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
                  {LEGAL.map((l) => (
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
            <div className={styles.muted}>© {year} DigiEmu · Alle Rechte vorbehalten</div>

            <div className={styles.meta}>
              <span className={styles.muted}>Support:</span>
              <a className={styles.mail} href="mailto:support@digiemu.ch">
                support@digiemu.ch
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
