import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminVendorsPage() {
  const session = await getServerSession(auth);
  const role = (session?.user as any)?.role;

  if (role !== "ADMIN") {
    return <div style={{ padding: 24 }}>Forbidden</div>;
  }

  const vendors = await prisma.vendorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true, role: true, isBlocked: true } },
    },
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Vendoren</h1>
      <p style={{ opacity: 0.75 }}>Freischalten / Sperren von Verkäuferprofilen.</p>

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 10 }}>User</th>
              <th style={{ padding: 10 }}>E-Mail</th>
              <th style={{ padding: 10 }}>VendorProfile</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Erstellt</th>
              <th style={{ padding: 10 }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 10 }}>{v.user?.name ?? "—"}</td>
                <td style={{ padding: 10 }}>{v.user?.email ?? "—"}</td>
                <td style={{ padding: 10, fontFamily: "monospace" }}>{v.id}</td>
                <td style={{ padding: 10 }}>
                  <StatusBadge status={(v as any).status} />
                </td>
                <td style={{ padding: 10 }}>
                  {new Date(v.createdAt).toLocaleDateString("de-CH")}
                </td>
                <td style={{ padding: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(v as any).status !== "APPROVED" ? (
                    <ActionButton
                      label="Freischalten"
                      endpoint={`/api/admin/vendors/${v.id}/approve`}
                    />
                  ) : (
                    <ActionButton
                      label="Sperren"
                      endpoint={`/api/admin/vendors/${v.id}/suspend`}
                    />
                  )}
                  <Link href={`/admin/users`} style={{ fontSize: 14, opacity: 0.8 }}>
                    Userverwaltung
                  </Link>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td style={{ padding: 10 }} colSpan={6}>
                  Keine VendorProfile gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status ?? "UNKNOWN";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.12)",
        fontSize: 12,
      }}
    >
      {label}
    </span>
  );
}

// Small client-side button via inline script-free fetch using a form
function ActionButton({ label, endpoint }: { label: string; endpoint: string }) {
  return (
    <form action={endpoint} method="post">
      <button
        type="submit"
        style={{
          padding: "8px 12px",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.12)",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    </form>
  );
}
