"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminBreadcrumbs() {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);

  if (parts[0] !== "admin") return null;
  const segments = parts.slice(1);

  if (segments.length === 0) {
    return (
      <div className="admin-breadcrumbs">
        <span className="admin-breadcrumbs-dot" />
        <span className="font-medium">Admin · Dashboard</span>
      </div>
    );
  }

  let url = "/admin";

  return (
    <div className="admin-breadcrumbs">
      <span className="admin-breadcrumbs-dot" />
      <Link href="/admin" className="admin-breadcrumbs-link">
        Admin
      </Link>
      {segments.map((seg, i) => {
        url += `/${seg}`;
        const label = seg.replace(/-/g, " ");

        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-[10px] opacity-60">›</span>
            <Link href={url} className="admin-breadcrumbs-link capitalize">
              {label}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
