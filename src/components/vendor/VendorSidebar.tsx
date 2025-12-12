"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard/vendor", label: "Übersicht" },
  { href: "/dashboard/vendor/stats", label: "Produkt-Performance" },
  { href: "/dashboard/vendor/ranking", label: "Ranking" },
  { href: "/dashboard/vendor/earnings", label: "Einnahmen" },
  { href: "/dashboard/vendor/payouts", label: "Auszahlungen" }
];

export default function VendorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 mb-6 md:mb-0 md:mr-6">
      <div className="neumorph-card p-4 md:p-6">
        <h2 className="text-lg font-bold mb-4">Vendor Bereich</h2>

        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm transition-all
                  ${active
                    ? "bg-[var(--soft-shadow-light)] dark:bg-[var(--soft-shadow-dark)] font-semibold"
                    : "opacity-70 hover:opacity-100"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
