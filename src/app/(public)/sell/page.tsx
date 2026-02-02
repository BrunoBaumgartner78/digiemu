"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SellPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    if (!session) {
      alert("Bitte melde dich zuerst an.");
      window.location.href = "/login";
      return;
    }

    setLoading(true);

    const res = await fetch("/api/vendor/onboard", {
      method: "POST",
    });

    setLoading(false);

    if (res.ok) {
      // Erfolgreich Vendor – ab ins Dashboard
      window.location.href = "/dashboard";
    } else {
      console.error("Onboard failed", await res.text());
      alert("Onboarding fehlgeschlagen. Bitte später erneut versuchen.");
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-body)] text-[var(--text-main)]">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]/95 shadow-[var(--shadow-soft)] px-8 py-8 space-y-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Verkaufe deine digitalen Produkte auf Bellu
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            Starte als Creator, lade deine Produkte hoch und verdiene an jedem Verkauf mit fairen Konditionen.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleOnboard}
              disabled={loading || status === "loading"}
              className="px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold shadow-[var(--shadow-soft)] hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Wird eingerichtet..." : "Zum Dashboard"}
            </button>
            <Link
              href="/marketplace"
              className="px-5 py-2.5 rounded-full border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--accent-soft)] transition-colors"
            >
              Produkte entdecken
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
