import styles from "./DashboardLayout.module.css";
import Link from "next/link";

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>DIGIEMU</div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.link}>Dashboard</Link>
          <Link href="/dashboard/products" className={styles.link}>Produkte</Link>
          <Link href="/dashboard/products/new" className={styles.link}>Neues Produkt</Link>
          <Link href="/dashboard/earnings" className={styles.link}>Einnahmen</Link>
          <Link href="/dashboard/payouts" className={styles.link}>Auszahlungen</Link>
          <Link href="/dashboard/profile" className={styles.link}>Profil</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
