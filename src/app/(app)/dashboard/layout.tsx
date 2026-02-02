// src/app/dashboard/layout.tsx (oder dein aktueller Pfad)
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Home,
  Package,
  Plus,
  LineChart,
  Wallet,
  User,
  DollarSign, // ✅ NEU
} from "lucide-react";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrapper}>
      {/* SIDEBAR (Desktop / Tablet) */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Bellu Creator</div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.link}>
            Übersicht
          </Link>
          <Link href="/dashboard/products" className={styles.link}>
            Produkte
          </Link>
          <Link href="/dashboard/products/top" className={styles.link}>
            Top-Produkte
          </Link>
          <Link href="/dashboard/new" className={styles.link}>
            Neues Produkt
          </Link>
          <Link href="/dashboard/earnings" className={styles.link}>
            Einnahmen
          </Link>
          <Link href="/dashboard/payouts" className={styles.link}>
            Auszahlungen
          </Link>
          <Link href="/dashboard/profile" className={styles.link}>
            Profil
          </Link>
        </nav>

        <p className={styles.sidebarHint}>
          Verdiene mit deinen digitalen Produkten – Bellu kümmert sich um Zahlung &amp; Download.
        </p>
      </aside>

      {/* HAUPT-INHALT */}
      <main className={styles.content}>{children}</main>

      {/* MOBILE NAVIGATION */}
      <footer className={styles.mobileNav}>
        <div className={styles.mobileShell}>
          <div className={styles.mobilePill}>
            {/* Floating Plus */}
            <Link
              href="/dashboard/new"
              className={styles.mobileFab}
              aria-label="Neues Produkt"
            >
              <Plus size={18} className={styles.mobileFabIcon} />
            </Link>

            {/* Icon-Reihe */}
            <nav className={styles.mobileRow} aria-label="Dashboard Navigation">
              <Link href="/dashboard" className={styles.mobileItem} aria-label="Übersicht">
                <Home size={18} className={styles.mobileIcon} />
              </Link>

              <Link href="/dashboard/products" className={styles.mobileItem} aria-label="Produkte">
                <Package size={18} className={styles.mobileIcon} />
              </Link>

              <Link
                href="/dashboard/products/top"
                className={styles.mobileItem}
                aria-label="Top-Produkte"
              >
                <LineChart size={18} className={styles.mobileIcon} />
              </Link>

              {/* ✅ HIER: Einnahmen statt LineChart -> DollarSign */}
              <Link
                href="/dashboard/earnings"
                className={styles.mobileItem}
                aria-label="Einnahmen"
              >
                <DollarSign size={18} className={styles.mobileIcon} />
              </Link>

              <Link
                href="/dashboard/payouts"
                className={styles.mobileItem}
                aria-label="Auszahlungen"
              >
                <Wallet size={18} className={styles.mobileIcon} />
              </Link>

              <Link href="/dashboard/profile" className={styles.mobileItem} aria-label="Profil">
                <User size={18} className={styles.mobileIcon} />
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
