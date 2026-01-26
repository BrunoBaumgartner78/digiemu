"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/errors";

type InitialData = {
  displayName: string;
  signature: string;
  notifyOnDownload: boolean;
  notifyOnPayoutRequest: boolean;
};

type Props = {
  userId: string;
  initialData: InitialData | null;
};

export default function AdminProfileClient({ userId, initialData }: Props) {
  const router = useRouter();

  const normalized = useMemo(() => ({
    displayName: initialData?.displayName ?? "",
    signature: initialData?.signature ?? "",
    notifyOnDownload: initialData?.notifyOnDownload ?? true,
    notifyOnPayoutRequest: initialData?.notifyOnPayoutRequest ?? true,
  }), [initialData]);

  const [form, setForm] = useState(normalized);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof InitialData, value : unknown) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/admin-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Fehler");
      if (typeof window !== "undefined") {
        try {
          // prefer toast when available, fallback to alert
          // dynamic import to avoid pulling toast provider into SSR bundle
          import("@/components/ui/use-toast").then((m) => {
            try { m.useToast().toast({ title: "Admin-Profil gespeichert", variant: "success" }); } catch { alert("Admin-Profil gespeichert"); }
          }).catch(() => alert("Admin-Profil gespeichert"));
        } catch { alert("Admin-Profil gespeichert"); }
      }
      router.refresh();
    } catch (err: unknown) {
      if (typeof window !== "undefined") {
        try {
          import("@/components/ui/use-toast").then((m) => {
            try { m.useToast().toast({ title: "Fehler", description: getErrorMessage(err, "Unbekannt"), variant: "destructive" }); } catch { alert(getErrorMessage(err, "Unbekannt")); }
          }).catch(() => alert(getErrorMessage(err, "Unbekannt")));
        } catch { alert(getErrorMessage(err, "Unbekannt")); }
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="neo-card p-4">
      <h1 className="text-xl font-semibold mb-3">Admin Profil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label>
          <div className="text-sm mb-1">Interner Anzeigename</div>
          <input value={form.displayName} onChange={(_e) => handleChange("displayName", _e.target.value)} className="input" />
        </label>

        <label>
          <div className="text-sm mb-1">Moderations-Signatur</div>
          <input value={form.signature} onChange={(_e) => handleChange("signature", _e.target.value)} className="input" />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.notifyOnDownload} onChange={(_e) => handleChange("notifyOnDownload", _e.target.checked)} />
          <span className="text-sm">Bei Download benachrichtigen</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.notifyOnPayoutRequest} onChange={(_e) => handleChange("notifyOnPayoutRequest", _e.target.checked)} />
          <span className="text-sm">Bei Payout-Anfrage benachrichtigen</span>
        </label>

        <div>
          <button className="neobtn" type="submit" disabled={saving}>{saving ? "Speichere…" : "Speichern"}</button>
        </div>
      </form>
    </div>
  );
}
