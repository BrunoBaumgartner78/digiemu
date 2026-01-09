// src/app/admin/layout.tsx
import "../globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(auth);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const tabs = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/users", label: "User" },
    { href: "/admin/products", label: "Produkte" },
    { href: "/admin/vendors", label: "Vendoren" },
    { href: "/admin/payouts", label: "Payouts" },
  ];

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-main)] px-4 pt-6 pb-20">
      <div className="max-w-7xl mx-auto">

        {/* NAVIGATION TABS */}
        <div className="admin-nav-shell mb-10">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className="admin-nav-pill">
              {t.label}
            </Link>
          ))}
        </div>

        {/* BREADCRUMBS */}
        <AdminBreadcrumbs />

        {/* CONTENT */}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
