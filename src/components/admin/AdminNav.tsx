"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "User" },
  { href: "/admin/products", label: "Produkte" },
  { href: "/admin/vendors", label: "Vendoren" },
  { href: "/admin/payouts", label: "Payouts" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav-shell">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/admin" && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-nav-pill ${isActive ? "admin-nav-pill--active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
