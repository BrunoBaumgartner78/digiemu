// src/app/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Pfad so wie bei /admin/users
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-[80vh] bg-[var(--bg)]">
      <div className="admin-shell">
        {/* kleine Breadcrumb-Pille oben */}
        <div className="admin-breadcrumb">
          <span>Admin</span>
          <span className="admin-breadcrumb-dot" />
          <span>Dashboard</span>
        </div>

        {/* Header */}
        <header className="admin-header">
          <div className="admin-kicker">DigiEmu · Control Center</div>
          <h1 className="admin-title">Admin-Dashboard</h1>
          <p className="admin-subtitle">
            Übersicht für Produkte, Verkäufer, Nutzer und Auszahlungen.
          </p>
        </header>

        {/* kleine Stat-Kacheln (rein optisch, keine Logik geändert) */}
        <section className="admin-stat-grid mb-6">
          <div className="admin-stat-card">
            <div className="admin-stat-label">Produkte</div>
            <div className="admin-stat-value">Alle Produkte verwalten</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Verkäufer</div>
            <div className="admin-stat-value">Vendor-Profile & Umsätze</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Auszahlungen</div>
            <div className="admin-stat-value">Payout-Requests prüfen</div>
          </div>
        </section>

        {/* Hauptkarten – verlinken wie vorher auf die Admin-Routen */}
        <section className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
          <Link href="/admin/products" className="admin-card block">
            <div className="badge-soft mb-2">Produkte</div>
            <h2 className="font-semibold mb-1 text-[var(--text-main)]">
              Produktverwaltung
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Alle Produkte einsehen, filtern, sperren oder löschen.
            </p>
          </Link>

          <Link href="/admin/vendors" className="admin-card block">
            <div className="badge-soft mb-2">Verkäufer</div>
            <h2 className="font-semibold mb-1 text-[var(--text-main)]">
              Vendor-Management
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Vendor-Profile, Produkte und Umsätze prüfen, sowie Payouts
              einsehen.
            </p>
          </Link>

          <Link href="/admin/users" className="admin-card block">
            <div className="badge-soft mb-2">Nutzer</div>
            <h2 className="font-semibold mb-1 text-[var(--text-main)]">
              Userverwaltung
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Käufer- & Verkäuferkonten verwalten, Rollen und Sperrstatus
              anpassen.
            </p>
          </Link>

          <Link href="/admin/payouts" className="admin-card block">
            <div className="badge-soft mb-2">Payouts</div>
            <h2 className="font-semibold mb-1 text-[var(--text-main)]">
              Auszahlungen
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Auszahlungsanfragen prüfen, offene Beträge einsehen und als
              bezahlt markieren.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
