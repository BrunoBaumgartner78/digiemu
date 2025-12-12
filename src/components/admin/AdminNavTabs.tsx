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

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-3 mb-6">
      {tabs.map((t) => {
        const isActive =
          pathname === t.href ||
          (t.href === "/admin" && pathname === "/admin/");

        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              // Grundstil (Light & Dark via CSS-Variablen)
              "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium",
              "border bg-[var(--nav-pill-bg)] text-[var(--nav-pill-text)]",
              "shadow-[0_10px_24px_rgba(148,163,184,0.40)]",
              "hover:bg-[var(--nav-pill-hover)] hover:shadow-[0_14px_32px_rgba(148,163,184,0.55)]",
              "transition-all duration-150",
              // Active-State
              isActive
                ? "bg-[var(--accent-strong)] text-white border-transparent shadow-[0_16px_40px_rgba(37,99,235,0.65)]"
                : "border-[var(--nav-pill-border)]",
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
