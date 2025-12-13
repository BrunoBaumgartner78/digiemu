// src/app/admin/vendors/[vendorId]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Params = { vendorId: string };

export default async function AdminVendorDetailPage(props: {
  params: Promise<Params>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="neumorph-card p-6 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Zugriff verweigert</h1>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Nur Administratoren dürfen diese Seite sehen.
          </p>
          <Link href="/admin" className="neobtn">
            Zurück zum Admin-Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { vendorId } = await props.params;

  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      vendorProfile: true,
      products: {
        include: {
          orders: {
            select: { vendorEarningsCents: true, createdAt: true },
          },
        },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="neumorph-card p-6 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Vendor nicht gefunden</h1>
          <Link href="/admin/vendors" className="neobtn mt-3 inline-flex">
            Zurück zur Verkäuferliste
          </Link>
        </div>
      </main>
    );
  }

  const allEarnings = vendor.products.flatMap((p) =>
    p.orders.map((o) => o.vendorEarningsCents ?? 0)
  );
  const totalEarnings = allEarnings.reduce((a, b) => a + b, 0);

  const alreadyPaid = vendor.payouts
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const pendingAmount = Math.max(totalEarnings - alreadyPaid, 0);

  return (
    <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <header className="section-header">
        <h1 className="text-2xl font-bold">
          Vendor-Details: {vendor.name || vendor.email}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Überblick über Profil, Produkte, Umsätze und Auszahlungen.
        </p>
        <div className="flex gap-3 mt-3 flex-wrap">
          <Link href="/admin/vendors" className="neobtn-sm ghost">
            ← Zurück zur Verkäuferliste
          </Link>
          <Link
            href={`/admin/payouts/vendor/${vendor.id}`}
            className="neobtn-sm primary"
          >
            Payout-Übersicht öffnen
          </Link>
        </div>
      </header>

      {/* Summary Boxes */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="neumorph-card p-5">
          <h3 className="text-xs opacity-70 mb-1">Gesamte Einnahmen</h3>
          <p className="text-2xl font-bold">
            CHF {(totalEarnings / 100).toFixed(2)}
          </p>
        </div>
        <div className="neumorph-card p-5">
          <h3 className="text-xs opacity-70 mb-1">Ausbezahlt</h3>
          <p className="text-2xl font-bold">
            CHF {(alreadyPaid / 100).toFixed(2)}
          </p>
        </div>
        <div className="neumorph-card p-5">
          <h3 className="text-xs opacity-70 mb-1">Ausstehend</h3>
          <p className="text-2xl font-bold">
            CHF {(pendingAmount / 100).toFixed(2)}
          </p>
        </div>
      </section>

      {/* Basic Info */}
      <section className="neumorph-card p-6 space-y-2">
        <h2 className="text-lg font-semibold mb-2">Basisdaten</h2>
        <p>
          <span className="font-medium">E-Mail:</span> {vendor.email}
        </p>
        <p>
          <span className="font-medium">Name:</span>{" "}
          {vendor.name || "—"}
        </p>
        <p>
          <span className="font-medium">Status:</span>{" "}
          {vendor.vendorProfile ? "ACTIVE" : "NO_PROFILE"}

        </p>
        {vendor.vendorProfile && (
          <>
            <p>
              <span className="font-medium">Öffentlicher Name:</span>{" "}
              {vendor.vendorProfile.displayName || "—"}
            </p>
            <p>
              <span className="font-medium">Kurzbeschreibung:</span>{" "}
              {vendor.vendorProfile.bio || "—"}
            </p>
          </>
        )}
      </section>

      {/* Products */}
      <section className="neumorph-card p-6">
        <h2 className="text-lg font-semibold mb-3">Produkte</h2>
        {vendor.products.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Dieser Vendor hat noch keine Produkte.
          </p>
        ) : (
          <div className="space-y-3">
            {vendor.products.map((p) => {
              const productRevenue = p.orders.reduce(
                (sum, o) => sum + (o.vendorEarningsCents ?? 0),
                0
              );
              return (
                <div
                  key={p.id}
                  className="flex justify-between items-center border-b border-slate-200/70 last:border-0 py-2"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {p.description?.slice(0, 80) || "Keine Beschreibung"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">
                      CHF {(productRevenue / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {p.orders.length} Bestellungen
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Payouts */}
      <section className="neumorph-card p-6">
        <h2 className="text-lg font-semibold mb-3">
          Bisherige Auszahlungen
        </h2>
        {vendor.payouts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Noch keine Auszahlungen erfasst.
          </p>
        ) : (
          <div className="space-y-3">
            {vendor.payouts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center border-b border-slate-200/70 last:border-0 py-2"
              >
                <div>
                  <p className="font-semibold">
                    CHF {(p.amountCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.createdAt.toLocaleDateString("de-CH")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    p.status === "PAID"
                      ? "bg-green-200 text-green-700"
                      : "bg-yellow-200 text-yellow-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
