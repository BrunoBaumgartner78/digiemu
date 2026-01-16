"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastProvider";

type GateState =
  | { ok: true }
  | { ok: false; code: "VENDOR_NOT_APPROVED" | "VENDOR_PROFILE_MISSING"; status?: string };

export default function VendorCreateGate() {
  const { push } = useToast();
  const [gate, setGate] = useState<GateState>({ ok: true });

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch("/api/vendor/profile-status", { cache: "no-store" });
        if (!alive) return;
        if (!res.ok) return;

        const data = await res.json().catch(() => null);
        const role = (data?.role ?? "").toString().toUpperCase();
        const st = (data?.vendorProfileStatus ?? "").toString().toUpperCase();
        const has = Boolean(data?.hasVendorProfile);

        if (role === "VENDOR") {
          if (!has) setGate({ ok: false, code: "VENDOR_PROFILE_MISSING" });
          else if (st !== "APPROVED") setGate({ ok: false, code: "VENDOR_NOT_APPROVED", status: st });
          else setGate({ ok: true });
        } else {
          setGate({ ok: true });
        }
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const message = useMemo(() => {
    if (gate.ok) return null;
    if (gate.code === "VENDOR_PROFILE_MISSING") {
      return "Du bist als Verkäufer registriert, aber dein Verkäuferprofil fehlt noch. Bitte zuerst Onboarding abschliessen.";
    }
    return `Dein Verkäuferprofil ist noch nicht freigeschaltet (Status: ${gate.status ?? "PENDING"}).`;
  }, [gate]);

  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>("[data-create-product-submit]");
    if (!btn) return;

    const originalTitle = btn.title;

    if (!gate.ok) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "pointer-events-auto");
      btn.title = "Warten auf Admin-Freigabe";
    } else {
      btn.disabled = false;
      btn.title = originalTitle || "";
    }

    const onClick = (e: MouseEvent) => {
      if (gate.ok) return;
      e.preventDefault();
      e.stopPropagation();
      push({
        kind: "info",
        title: "Noch nicht freigeschaltet",
        message: message || "",
        ttlMs: 4500,
      });
    };

    btn.addEventListener("click", onClick, true);

    return () => {
      btn.removeEventListener("click", onClick, true);
    };
  }, [gate, message, push]);

  if (gate.ok) return null;

  return (
    <div className="neumorph-card p-4 mb-4 border border-[var(--neo-card-border)]">
      <div className="text-sm font-semibold">Du kannst noch keine Produkte erstellen</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{message}</div>
    </div>
  );
}
