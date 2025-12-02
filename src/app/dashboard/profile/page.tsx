// src/app/dashboard/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] bg-[var(--bg)] px-4 py-8 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--text-main)]">
            Profil / Vendor-Daten
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Hier kannst du später deine öffentlichen Vendor-Informationen bearbeiten
            (Shop-Name, Beschreibung, Avatar, Auszahlungsdaten …).
          </p>
        </section>

        <section className="neo-card p-6">
          <p className="text-sm text-[var(--text-muted)]">
            Platzhalter – die eigentliche Profilbearbeitung bauen wir in einem
            nächsten Schritt. Aktuell bist du eingeloggt als:
          </p>
          <div className="mt-4 text-sm">
            <div><span className="font-semibold">Name:</span> {user.name}</div>
            <div><span className="font-semibold">E-Mail:</span> {user.email}</div>
            <div><span className="font-semibold">Rolle:</span> {user.role}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
