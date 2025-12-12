// src/app/register-vendor/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

export default async function RegisterVendorPage() {
  const session = await getServerSession(authOptions);

  // Nicht eingeloggt → Login
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;
  const userId = user.id;

  // Prüfen, ob schon Vendor-Profil existiert
  const existingVendor = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  // ─────────────────────────────────────────────
  // FALL 1: USER IST BEREITS VERKÄUFER
  // ─────────────────────────────────────────────
  if (existingVendor) {
    return (
      <main className="page-shell">
        <section className="neo-surface p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
            Du bist bereits DigiEmu-Verkäufer 🎉
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Dein Verkäuferprofil ist schon angelegt. Du kannst direkt zu deinem
            Dashboard oder zum Analytics-Dashboard wechseln.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full
                         bg-[var(--color-accent)] text-white text-sm font-medium
                         shadow-[0_8px_24px_rgba(59,130,246,0.35)]
                         hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Verkäufer-Übersicht
            </a>

            <a
              href="/dashboard/vendor"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full
                         bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm font-medium
                         shadow-[0_6px_18px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]
                         hover:bg-[var(--color-surface-strong)] hover:scale-[1.02]
                         active:scale-[0.98] transition-all"
            >
              Analytics-Dashboard
            </a>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Wenn du dein Verkäuferprofil ändern möchtest (z.B. Name, Beschreibung),
            kannst du das später im Bereich <strong>Profil</strong> erledigen.
          </p>
        </section>
      </main>
    );
  }

  // ─────────────────────────────────────────────
  // FALL 2: NOCH KEIN VENDOR-PROFIL → FORMULAR
  // ─────────────────────────────────────────────
  return (
    <main className="page-shell">
      <section className="neo-surface p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">
          Werde DigiEmu-Verkäufer
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
          Erstelle jetzt dein Verkäuferprofil und lade deine ersten digitalen
          Produkte hoch. Du erhältst 80 % der Einnahmen, DigiEmu kümmert sich um
          Zahlung &amp; Downloads.
        </p>

        {/* ⬇️ HIER dein Vendor-Onboarding-Formular einfügen */}
      </section>
    </main>
  );
}
