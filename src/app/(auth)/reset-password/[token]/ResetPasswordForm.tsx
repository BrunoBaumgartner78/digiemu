"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (pw1.length < 8) return setErr("Passwort muss mindestens 8 Zeichen haben.");
    if (pw1 !== pw2) return setErr("Passwörter stimmen nicht überein.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password: pw1 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Reset fehlgeschlagen.");
      }

      router.push("/login?reset=1");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Reset fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Neues Passwort</label>
        <input
          type="password"
          value={pw1}
          onChange={(_e) => setPw1(_e.target.value)}
          className="w-full rounded-xl border px-3 py-2 bg-white"
          autoComplete="new-password"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Passwort wiederholen</label>
        <input
          type="password"
          value={pw2}
          onChange={(_e) => setPw2(_e.target.value)}
          className="w-full rounded-xl border px-3 py-2 bg-white"
          autoComplete="new-password"
          required
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl border px-4 py-2 text-sm font-semibold bg-white disabled:opacity-60"
      >
        {loading ? "Speichern..." : "Passwort speichern"}
      </button>
    </form>
  );
}
