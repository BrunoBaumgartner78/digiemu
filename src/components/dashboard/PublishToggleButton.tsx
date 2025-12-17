"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  status: string;     // "DRAFT" | "ACTIVE" | ...
  isActive: boolean;
};

export default function PublishToggleButton({ productId, status, isActive }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const published = status === "ACTIVE" && isActive;

  async function onClick() {
    startTransition(async () => {
      const res = await fetch(`/api/vendor/products/${productId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !published }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Publish-Update fehlgeschlagen");
        return;
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className={`neobtn ${published ? "ghost" : "primary"}`}
      onClick={onClick}
      disabled={isPending}
      aria-busy={isPending}
    >
      {isPending ? "…" : published ? "Deaktivieren" : "Veröffentlichen"}
    </button>
  );
}
