// src/app/dashboard/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <main className="page-shell-wide">
      <section className="neo-surface p-6 md:p-8 space-y-8">
        {/* HEADER */}
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
            Profil &amp; Vendor-Daten
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
            Hier bearbeitest du später deinen öffentlichen Auftritt als
            Verkäufer: Shop-Name, Beschreibung, Avatar und Auszahlungsdaten.
            Aktuell zeigen wir dir eine kompakte Übersicht deines Kontos.
          </p>
        </header>

        {/* USER CARD */}
        <section className="neo-card p-6 md:p-7 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Eingeloggt als
              </p>
              <h2 className="mt-1 text-lg md:text-xl font-semibold text-[var(--color-text-primary)]">
                {user.name ?? "Unbekannter Nutzer"}
              </h2>
            </div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] bg-emerald-500/10 border border-emerald-400/40 text-emerald-300">
              {user.role}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Name
              </p>
              <p className="text-sm text-[var(--color-text-primary)]">
                {user.name ?? "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                E-Mail
              </p>
              <p className="text-sm text-[var(--color-text-primary)]">
                {user.email ?? "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Rolle
              </p>
              <p className="text-sm text-[var(--color-text-primary)]">
                {user.role}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Status
              </p>
              <p className="text-sm text-[var(--color-text-primary)]">
                Account aktiv · Verkäufe möglich
              </p>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
            ✨ Demnächst kannst du hier deinen öffentlichen Shop-Namen,
            Beschreibung, Profilbild und Auszahlungsdetails hinterlegen.
          </p>
        </section>
      </section>
    </main>
  );
}
