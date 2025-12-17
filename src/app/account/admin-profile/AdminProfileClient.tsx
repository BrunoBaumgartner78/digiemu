"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const normalized = useMemo(() => ({
    displayName: initialData?.displayName ?? "",
    signature: initialData?.signature ?? "",
    notifyOnDownload: initialData?.notifyOnDownload ?? true,
    notifyOnPayoutRequest: initialData?.notifyOnPayoutRequest ?? true,
  }), [initialData]);

  const [form, setForm] = useState(normalized);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof InitialData, value: any) => {
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
      toast({ title: "Admin-Profil gespeichert", variant: "success" });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Fehler", description: err?.message || "Unbekannt", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="neo-card p-4">
      <h1 className="text-xl font-semibold mb-3">Admin Profil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label>
          <div className="text-sm mb-1">Interner Anzeigename</div>
          <input value={form.displayName} onChange={(e) => handleChange("displayName", e.target.value)} className="input" />
        </label>

        <label>
          <div className="text-sm mb-1">Moderations-Signatur</div>
          <input value={form.signature} onChange={(e) => handleChange("signature", e.target.value)} className="input" />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.notifyOnDownload} onChange={(e) => handleChange("notifyOnDownload", e.target.checked)} />
          <span className="text-sm">Bei Download benachrichtigen</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.notifyOnPayoutRequest} onChange={(e) => handleChange("notifyOnPayoutRequest", e.target.checked)} />
          <span className="text-sm">Bei Payout-Anfrage benachrichtigen</span>
        </label>

        <div>
          <button className="neobtn" type="submit" disabled={saving}>{saving ? "Speichere…" : "Speichern"}</button>
        </div>
      </form>
    </div>
  );
}
