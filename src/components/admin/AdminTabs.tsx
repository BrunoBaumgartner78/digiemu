import Link from "next/link";
import { routes } from "@/lib/routes";

type Tab = { label: string; href: string };

const tabs: Tab[] = [
  { label: "Dashboard", href: routes.adminHome },
  { label: "Orders", href: routes.adminOrders },
  { label: "User", href: routes.adminUsers },
  { label: "Produkte", href: routes.adminProducts },
  { label: "Vendoren", href: routes.adminVendors },
  { label: "Payouts", href: routes.adminPayouts },
  { label: "Downloads", href: routes.adminDownloads },
];

export default function AdminTabs({
  className,
  activeHref,
}: {
  className?: string;
  activeHref?: string;
}) {
  return (
    <nav className={className} aria-label="Admin Navigation">
      {tabs.map((t) => {
        const active = activeHref && (activeHref === t.href || activeHref.startsWith(t.href + "/"));
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: 999,
              marginRight: 8,
              border: "1px solid rgba(255,255,255,.10)",
              background: active ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.04)",
              textDecoration: "none",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
