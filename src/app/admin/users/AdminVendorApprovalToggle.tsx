"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  vendorProfileId: string | null;
  status: string | null; // PENDING | APPROVED | REJECTED | SUSPENDED | null
};

export default function AdminVendorApprovalToggle({ vendorProfileId, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const { label, endpoint } = useMemo(() => {
    if (!vendorProfileId) return { label: "Kein VendorProfile", endpoint: null };

    const s = String(status ?? "PENDING");

    if (s === "APPROVED") {
      return { label: "Suspendieren", endpoint: `/api/admin/vendors/${vendorProfileId}/suspend` };
    }

    // PENDING / REJECTED / SUSPENDED => approve
    return { label: "Freischalten", endpoint: `/api/admin/vendors/${vendorProfileId}/approve` };
  }, [vendorProfileId, status]);

  const disabled = !vendorProfileId || pending;

  async function handleClick() {
    if (!endpoint) return;

    setPending(true);
    try {
      const res = await fetch(endpoint, { method: "POST", cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Vendor update failed");
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Konnte Vendor-Status nicht ändern. Schau Console/Serverlogs an.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`neobtn-sm ${
        !vendorProfileId
          ? "opacity-50 cursor-not-allowed"
          : status === "APPROVED"
          ? "bg-rose-500/90 text-white"
          : "bg-indigo-500/90 text-white"
      }`}
      title={!vendorProfileId ? "Kein VendorProfile: Vendor muss zuerst Onboarding/Registrierung machen" : ""}
    >
      {pending ? "Aktualisiere…" : label}
    </button>
  );
}
