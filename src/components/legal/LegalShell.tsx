import React from "react";
import styles from "./LegalShell.module.css";

type Props = {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
};

export default function LegalShell({
  eyebrow = "RECHTLICHES",
  title,
  lead,
  children,
}: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={`${styles.header} neonCard neonBorder glowSoft`}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
        </header>

        <section className={`${styles.card} neonCard glowSoft`}>
          <div className={styles.content}>{children}</div>
        </section>
      </div>
    </div>
  );
}
