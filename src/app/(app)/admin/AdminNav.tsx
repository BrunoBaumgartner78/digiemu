"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import styles from "./admin-layout.module.css";

const NAV = [
  { href: "/admin", label: "Dashboard", segment: null as string | null },
  { href: "/admin/orders", label: "Orders", segment: "orders" },
  { href: "/admin/users", label: "User", segment: "users" },
  { href: "/admin/products", label: "Produkte", segment: "products" },
  { href: "/admin/vendors", label: "Vendoren", segment: "vendors" },
  { href: "/admin/payouts", label: "Payouts", segment: "payouts" },
  { href: "/admin/downloads", label: "Downloads", segment: "downloads" },
];

export default function AdminNav() {
  const seg = useSelectedLayoutSegment(); // string | null

  return (
    <nav className={styles.nav} aria-label="Admin Navigation">
      {NAV.map((item) => {
        const active = item.segment === seg;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
