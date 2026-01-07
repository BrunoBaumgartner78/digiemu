"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

// treat IDs as non-linkable crumbs (UUID / cuid / numeric)
function looksLikeId(seg: string) {
  const s = (seg || "").trim();
  if (!s) return false;

  // UUID v4-ish
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return true;

  // Prisma cuid / cuid2 (rough)
  if (/^c[a-z0-9]{20,}$/i.test(s)) return true;

  // numeric ids
  if (/^\d+$/.test(s)) return true;

  return false;
}

function isBracketRoute(seg: string) {
  // matches: [id], [tenantId], [...slug], [[...slug]]
  return seg.startsWith("[") && seg.endsWith("]");
}

function labelize(seg: string) {
  return decodeURIComponent(seg)
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .trim();
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);

  // Build crumbs progressively: /admin -> /admin/tenants -> /admin/tenants/<id>
  const crumbs = parts.map((seg, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    return { seg, href };
  });

  return (
    <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
      <span className="flex items-center gap-1">
        <Link href="/admin" className="admin-breadcrumbs-link">
          Admin
        </Link>
      </span>

      {crumbs.map(({ seg, href }, i) => {
        const noLink = isBracketRoute(seg) || looksLikeId(seg);

        return (
          <span key={`${href}-${i}`} className="flex items-center gap-1">
            <span className="text-[10px] opacity-60">›</span>

            {noLink ? (
              <span className="admin-breadcrumbs-link opacity-70">
                {labelize(seg)}
              </span>
            ) : (
              <Link href={href} className="admin-breadcrumbs-link capitalize">
                {labelize(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
