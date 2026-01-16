"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  userId: string;
  initialStatus: "PENDING" | "APPROVED" | "BLOCKED" | string | null;
  initialIsPublic: boolean | null;
};

export default function AdminVendorProfileToggles({ userId, initialStatus, initialIsPublic }: Props) {
  const [status, setStatus] = useState((initialStatus ?? "PENDING").toString().toUpperCase());
  const [isPublic, setIsPublic] = useState(!!initialIsPublic);
  const [busy, setBusy] = useState<"status" | "public" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const setVendorStatus = async (next: string) => {
    if (busy) return;
    setBusy("status");
    try {
      const res = await fetch(`/api/admin/vendors/${userId}/vendorprofile/set-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Speichern fehlgeschlagen", description: json?.message ?? "Unbekannter Fehler", variant: "destructive" });
        return;
      }
      // optimistic update
      setStatus(next.toString().toUpperCase());
      toast({ title: "Vendor Status gespeichert", description: `Status aktualisiert`, variant: "success" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Netzwerkfehler", description: e?.message ?? "Bitte erneut versuchen", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const togglePublic = async () => {
    if (busy) return;
    setBusy("public");
    try {
      const res = await fetch(`/api/admin/vendors/${userId}/vendorprofile/toggle-public`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Speichern fehlgeschlagen", description: json?.message ?? "Unbekannter Fehler", variant: "destructive" });
        return;
      }
      // optimistic toggle
      setIsPublic((s) => !s);
      toast({ title: "Profil Sichtbarkeit aktualisiert", description: isPublic ? "Private" : "Public", variant: "success" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Netzwerkfehler", description: e?.message ?? "Bitte erneut versuchen", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        className="input-neu w-36 text-xs"
        value={status}
        disabled={busy !== null}
        onChange={(_e) => setVendorStatus(e.target.value)}
      >
        <option value="PENDING">PENDING</option>
        <option value="APPROVED">APPROVED</option>
        <option value="BLOCKED">BLOCKED</option>
      </select>

      <button
        type="button"
        className={`neobtn-sm ${isPublic ? "" : "ghost"}`}
        onClick={togglePublic}
        disabled={busy !== null}
        title="Marketplace-Sichtbarkeit: nur Public Profiles erscheinen"
      >
        {busy === "public" ? "Speichere…" : isPublic ? "Public ✅" : "Public ❌"}
      </button>
    </div>
  );
}
