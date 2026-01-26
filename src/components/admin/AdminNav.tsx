"use client";

// src/components/admin/AdminNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./adminNav.module.css";
import { ADMIN_LINKS } from "./adminLinks";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname() || "";

  return (
    <nav className={styles.nav} aria-label="Admin Navigation">
      <div className={styles.pills}>
        {ADMIN_LINKS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.pill} ${active ? styles.active : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
