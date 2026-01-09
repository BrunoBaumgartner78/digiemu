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
  { label: "Über das Content OS", href: "/about-marketplace" },
];

const QUICK: FooterLink[] = [
  { label: "Content OS", href: "/marketplace" },
  { label: "Preise", href: "/preise" },
  { label: "Hilfe", href: "/help" },
];

export default function MainFooter({ variant = "DEFAULT" }: { variant?: "DEFAULT" | "MINIMAL" }) {
  const isMinimal = variant === "MINIMAL";
  const year = new Date().getFullYear();

  if (isMinimal) {
    return (
      <footer className="site-footer p-6 border-t bg-white mt-8">
        <div className="max-w-6xl mx-auto text-sm text-[var(--text-muted)] flex items-center justify-between">
          <div>
            <span>Powered by </span>
            <a href="https://digiemu.example" className="underline">
              DigiEmu
            </a>
          </div>

          <div>© {year}</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.wrap} aria-label="Footer">
      <div className={styles.container}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, marginBottom: 8 }}>
          <a href="/impressum">Impressum</a>
          <a href="/datenschutz">Datenschutz</a>
          <a href="/help">Hilfe</a>
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
                <div className={styles.title}>Digitaler Content OS</div>
                <p className={styles.tagline}>
                  Digitale Produkte von Creators – sicher kaufen, einfach verkaufen.
                </p>

                <div className={styles.quick}>
                  {QUICK.map((l) => (
                    <a key={l.href} href={l.href} className={styles.pill}>
                      {l.label}
                    </a>
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
                      <a href={l.href} className={styles.link}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.col}>
                <div className={styles.colTitle}>Infos</div>
                <ul className={styles.list}>
                  {INFO.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className={styles.link}>
                        {l.label}
                      </a>
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
                <a key={l.href} href={l.href} className={styles.link}>
                  {l.label}
                </a>
              ))}
              <a href="/help" className={styles.link}>Hilfe</a>
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
