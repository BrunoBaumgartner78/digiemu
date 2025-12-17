// src/app/admin/orders/page.tsx
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

type Props = {
  // Next 15/16: searchParams kann Promise sein
  searchParams?: Promise<SearchParams>;
};

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const session = await getServerSession(auth);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const sp: SearchParams = searchParams ? await searchParams : {};

  // Filter: Status / Vendor
  const status = pickFirst(sp.status) ?? "ALL";
  const vendor = pickFirst(sp.vendor) ?? "ALL";

  const where: any = {};
  if (status !== "ALL") where.status = status;

  // ✅ Product.vendorId ist bei dir User-ID des Vendors
  if (vendor !== "ALL") where.product = { vendorId: vendor };

  // Load orders, newest first
  const orders = await prisma.order.findMany({
    where,
    include: {
      product: {
        select: {
          title: true,
          vendor: {
            select: {
              id: true,
              email: true,
              vendorProfile: { select: { displayName: true } },
            },
          },
        },
      },
      buyer: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Load vendors for filter
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
    select: {
      id: true,
      email: true,
      vendorProfile: { select: { displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="admin-shell">
      <div className="admin-breadcrumb">
        <span>Admin</span>
        <span className="admin-breadcrumb-dot" />
        <span>Orders</span>
      </div>

      <header className="admin-header">
        <div className="admin-kicker">DigiEmu · Admin</div>
        <h1 className="admin-title">Bestellungen</h1>
        <p className="admin-subtitle">
          Alle Bestellungen, Einnahmen-Aufteilung & Status.
        </p>
      </header>

      <section className="mb-6">
        <form className="flex flex-wrap gap-2 items-center">
          <label>
            Status:
            <select name="status" defaultValue={status} className="input-neu ml-2">
              <option value="ALL">Alle</option>
              <option value="PAID">Bezahlt</option>
              <option value="PENDING">Ausstehend</option>
            </select>
          </label>

          <label>
            Vendor:
            <select name="vendor" defaultValue={vendor} className="input-neu ml-2">
              <option value="ALL">Alle</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendorProfile?.displayName || v.email}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="neobtn-sm">
            Filtern
          </button>
        </form>
      </section>

      {orders.length === 0 ? (
        <div className="admin-card text-[var(--text-muted)]">
          Keine Bestellungen gefunden.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[900px]">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Produkt</th>
                <th>Vendor</th>
                <th>Käufer</th>
                <th>Betrag (CHF)</th>
                <th>Plattform (CHF)</th>
                <th>Vendor (CHF)</th>
                <th>Status</th>
                <th>Erstellt am</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-xs">{order.id.slice(0, 8)}…</td>
                  <td>{order.product?.title || "-"}</td>
                  <td>
                    {order.product?.vendor?.vendorProfile?.displayName ||
                      order.product?.vendor?.email ||
                      "-"}
                  </td>
                  <td>{order.buyer?.email || "-"}</td>
                  <td>{(order.amountCents / 100).toFixed(2)}</td>
                  <td>{(order.platformEarningsCents / 100).toFixed(2)}</td>
                  <td>{(order.vendorEarningsCents / 100).toFixed(2)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString("de-CH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
