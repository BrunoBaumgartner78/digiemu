"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  productId: string;
  initialStatus: "ACTIVE" | "DRAFT" | "BLOCKED" | string;
  initialIsActive: boolean;
};

export default function AdminProductStatusToggle({
  productId,
  initialStatus,
  initialIsActive,
}: Props) {
  const [status, setStatus] = useState(String(initialStatus));
  const [isActive, setIsActive] = useState(!!initialIsActive);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function update(next: { status?: string; isActive?: boolean }) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/set-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Speichern fehlgeschlagen", description: err?.message ?? "Unbekannter Fehler", variant: "destructive" });
        return;
      }

      // Optimistic UI: apply the requested values locally
      if (next.status) setStatus(String(next.status));
      if (typeof next.isActive === "boolean") setIsActive(next.isActive);
      toast({ title: "Produkt aktualisiert", description: `Status aktualisiert`, variant: "success" });
      router.refresh();
    } catch (e: any) {
      toast({ title: "Netzwerkfehler", description: e?.message ?? "Bitte erneut versuchen", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const canToggleActive = status === "ACTIVE" && !busy;

  return (
    <div className="inline-flex items-center gap-2">
      <select
        className="input-neu w-32"
        value={status}
        disabled={busy}
          onChange={(e) => {
            const nextStatus = e.target.value;
            const nextIsActive = nextStatus === "BLOCKED" ? false : isActive;
            update({ status: nextStatus, isActive: nextIsActive });
          }}
      >
        <option value="ACTIVE">ACTIVE</option>
        <option value="DRAFT">DRAFT</option>
        <option value="BLOCKED">BLOCKED</option>
      </select>

      <button
        type="button"
        className="neobtn-sm"
        disabled={!canToggleActive}
        onClick={() => update({ isActive: !isActive })}
        title={status !== "ACTIVE" ? "Aktiv-Flag ist nur bei ACTIVE sinnvoll" : ""}
      >
        {busy ? "Speichere…" : isActive ? "Active ✅" : "Active ❌"}
      </button>
    </div>
  );

}
