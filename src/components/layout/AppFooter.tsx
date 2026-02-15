// src/components/layout/AppFooter.tsx
import Link from "next/link";
import styles from "./AppFooter.module.css";

function holidayEmoji(): string | null {
  const d = new Date();
  const m = d.getMonth() + 1; // 1..12
  const day = d.getDate();

  // --- Personal priority ---
  if (m === 1 && day === 14) return "🥂"; // Jan 14 special
  if (m === 3 && day === 8) return "🎂"; // Women’s Day treated as birthday

  // Birthdays
  if (m === 5 && day === 15) return "🎂";
  if (m === 6 && day === 16) return "🎂";
  if (m === 6 && day === 21) return "🎂";
  if (m === 6 && day === 29) return "🎂";
  if (m === 9 && day === 2) return "🎂";

  // --- Fixed holidays (CH/EU-friendly) ---
  if (m === 1 && day === 1) return "✨";   // New Year
  if (m === 1 && day === 6) return "👑";   // Epiphany (many regions)
  if (m === 2 && day === 14) return "💜";  // Valentine's
  if (m === 3 && day === 17) return "🍀";  // St. Patrick (optional)
  if (m === 5 && day === 1) return "🛠️";  // Labour Day
  if (m === 8 && day === 1) return "🇨🇭";  // Swiss National Day
  if (m === 10 && day === 31) return "🎃"; // Halloween
  if (m === 11 && day === 1) return "🕯️"; // All Saints (some CH cantons)
  if (m === 12 && day >= 24 && day <= 26) return "🎄"; // Christmas
  if (m === 12 && day === 31) return "✨";  // New Year's Eve

  return null;
}

export default function AppFooter() {
  const emoji = holidayEmoji();

  return (
    <footer className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.grid}>
          <div>
            <div className={styles.brandRow}>
              <span className={styles.logoDot} />
              <div className={styles.title}>
                Bellu{" "}
                {emoji ? (
                  <span className={styles.emojiGlow} aria-hidden="true">
                    {emoji}
                  </span>
                ) : null}
              </div>
            </div>
            <div className={styles.sub}>
              Digitaler Marktplatz für faire Wertschöpfung — kaufen & verkaufen von digitalen Produkten.
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>Rechtliches</div>
            <div className={styles.links}>
              <Link className={styles.link} href="/impressum">
                Impressum
              </Link>
              <Link className={styles.link} href="/datenschutz">
                Datenschutz
              </Link>
              <Link className={styles.link} href="/agb">
                AGB
              </Link>
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>Support</div>
            <div className={styles.links}>
              <Link className={styles.link} href="/help">
                Hilfe
              </Link>
              <Link className={styles.link} href="/pricing">
                Preise
              </Link>
              <a className={styles.link} href="mailto:support@bellu.ch">
                support@bellu.ch
              </a>
              <div className={styles.chip}>DigiEmu v1.2.1  | softlaunch · Neumorph Neon</div>
            </div>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <span>© {new Date().getFullYear()} DigiEmu</span>
          <span>Made with 🩵 in · Switzerland</span>
        </div>
      </div>
    </footer>
  );
}
