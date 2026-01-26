// src/components/admin/adminLinks.ts
export type AdminLink = { href: string; label: string };

export const ADMIN_LINKS: AdminLink[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "User" },
  { href: "/admin/products", label: "Produkte" },
  { href: "/admin/vendors", label: "Vendoren" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/downloads", label: "Downloads" },
];
