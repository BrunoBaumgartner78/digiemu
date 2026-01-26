"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileImageUploader from "../profile/ProfileImageUploader";
import { useToast } from "@/components/ui/use-toast";
import { getErrorMessage } from "@/lib/errors";

type InitialData = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  isPublic: boolean;
};

type Props = {
  userId: string;
  initialData: InitialData | null;
};

export default function BuyerProfileClient({ userId, initialData }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const normalized = useMemo(() => ({
    displayName: initialData?.displayName ?? "",
    bio: initialData?.bio ?? "",
    avatarUrl: initialData?.avatarUrl ?? "",
    isPublic: initialData?.isPublic ?? false,
  }), [initialData]);

  const [form, setForm] = useState(normalized);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof InitialData, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.avatarUrl?.startsWith("blob:")) {
        toast({ title: "Avatar nicht hochgeladen", description: "Bitte Avatar zuerst hochladen.", variant: "destructive" });
        return;
      }

      const res = await fetch("/api/account/buyer-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Fehler");

      toast({ title: "Profil gespeichert", variant: "success" });
      router.refresh();
    } catch (err : unknown) {
      toast({ title: "Fehler", description: getErrorMessage(err, "Unbekannt"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="neo-card p-4">
      <h1 className="text-xl font-semibold mb-3">Dein Käufer-Profil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ProfileImageUploader userId={userId} avatarUrl={form.avatarUrl} onAvatarChange={(u) => handleChange("avatarUrl", u)} onBannerChange={() => {}} />

        <label className="block">
          <div className="text-sm mb-1">Anzeigename</div>
          <input value={form.displayName} onChange={(_e) => handleChange("displayName", _e.target.value)} className="input" />
        </label>

        <label className="block">
          <div className="text-sm mb-1">Bio</div>
          <textarea value={form.bio} onChange={(_e) => handleChange("bio", _e.target.value)} className="input" />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isPublic} onChange={(_e) => handleChange("isPublic", _e.target.checked)} />
          <span className="text-sm">Profil öffentlich</span>
        </label>

        <div>
          <button className="neobtn" type="submit" disabled={saving}>{saving ? "Speichere…" : "Speichern"}</button>
        </div>
      </form>
    </div>
  );
}
