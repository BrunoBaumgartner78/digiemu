"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { isErrorResponse } from "@/lib/guards";
import type { ProductStatus } from "@prisma/client";

type Props = {
  productId: string;
  initialStatus: ProductStatus | string;
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
        const payload: unknown = await res.json().catch(() => ({}));
        const msg = isErrorResponse(payload) ? payload.message : "Unbekannter Fehler";
        toast({ title: "Speichern fehlgeschlagen", description: msg, variant: "destructive" });
        return;
      }

      // Optimistic UI: apply the requested values locally
      if (next.status) setStatus(String(next.status));
      if (typeof next.isActive === "boolean") setIsActive(next.isActive);
      toast({ title: "Produkt aktualisiert", description: `Status aktualisiert`, variant: "success" });
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error ?? "");
      toast({ title: "Netzwerkfehler", description: msg || "Bitte erneut versuchen", variant: "destructive" });
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
