import React from "react";
import styles from "./LegalToc.module.css";

export type TocItem = { id: string; label: string };

export default function LegalToc({ items }: { items: TocItem[] }) {
  if (!items?.length) return null;

  return (
    <nav className={`${styles.toc} neonCard glowSoft`} aria-label="Inhaltsverzeichnis">
      <div className={styles.title}>Inhaltsverzeichnis</div>
      <ul className={styles.list}>
        {items.map((it) => (
          <li key={it.id} className={styles.item}>
            <a className={styles.link} href={`#${it.id}`}>
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
