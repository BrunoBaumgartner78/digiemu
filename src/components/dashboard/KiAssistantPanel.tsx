"use client";
import styles from "./KiAssistantPanel.module.css";

export default function KiAssistantPanel() {
  return (
    <section className={styles.panel} aria-label="KI-Assistent Platzhalter">
      <div className={styles.icon}>🤖✨</div>
      <h2 className={styles.title}>KI-Assistent (coming soon)</h2>
      <p className={styles.text}>
        Bald kannst du hier mit unserem KI-Assistenten sprechen: Er hilft dir beim Schreiben von Produkttexten, gibt Pricing-Tipps und beantwortet häufige Fragen rund um DigiEmu.
        <br />
        Die API-Anbindung folgt – bis dahin ist dies nur ein UI-Slot.
      </p>
    </section>
  );
}
