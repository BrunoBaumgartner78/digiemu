// src/app/dashboard/payouts/RequestPayoutButton.tsx
"use client";

import { useState } from "react";

type Props = {
  availableCents: number;
  pendingRequestedCents?: number;
};

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export default function RequestPayoutButton({
  availableCents,
  pendingRequestedCents = 0,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const hasPending = pendingRequestedCents > 0;
  const canRequest = availableCents > 0 && !hasPending;
  const disabled = busy || !canRequest;

  async function request() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/payouts/request", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error ?? "Request fehlgeschlagen.");
        return;
      }

      setMsg("Payout-Request wurde erstellt ✅");
      window.location.reload();
    } catch {
      setMsg("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }

  const buttonLabel = busy
    ? "Wird gesendet…"
    : hasPending
      ? "Request läuft"
      : availableCents <= 0
        ? "Kein Betrag verfügbar"
        : "Payout anfragen";

  const isPendingState = hasPending && !busy;
  const isDisabledState = !canRequest && !busy;

  return (
    <div className="mt-7">
      {/* ✅ Kein Rahmen/Panel mehr */}
      <div className="flex flex-col items-start gap-5">
        <button
          type="button"
          onClick={request}
          disabled={disabled}
          className={[
            "inline-flex items-center justify-center",
            "rounded-full",
            "px-8 py-4",
            "min-w-[240px] md:min-w-[260px]",
            "text-[11px] md:text-xs font-extrabold tracking-[0.18em] uppercase",
            "leading-none",
            "transition-all select-none",
            "border",
            "shadow-[inset_-8px_-8px_16px_rgba(0,0,0,0.28),inset_8px_8px_16px_rgba(255,255,255,0.10),0_16px_44px_rgba(0,0,0,0.22)]",
            !disabled && !isPendingState
              ? "border-white/20 text-white/92 bg-[linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.06))] hover:brightness-110 active:scale-[0.99]"
              : "",
            isPendingState
              ? "cursor-not-allowed border-white/16 text-white/92 bg-[linear-gradient(180deg,rgba(255,210,110,0.16),rgba(255,255,255,0.05))] shadow-[inset_-6px_-6px_12px_rgba(0,0,0,0.24),inset_6px_6px_12px_rgba(255,255,255,0.08)]"
              : "",
            isDisabledState
              ? "cursor-not-allowed border-white/10 text-white/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.22),inset_5px_5px_10px_rgba(255,255,255,0.06)]"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {buttonLabel}
        </button>

        {/* ✅ Text ohne Rahmen, mit mehr White Space */}
        <div className="space-y-3 text-xs text-white/72 leading-6 max-w-[720px]">
          {hasPending ? (
            <div className="space-y-2">
              <div className="text-white/85 font-semibold tracking-wide">
                Request läuft
              </div>
              <div>
                Offener Request:{" "}
                <span className="font-semibold text-white/92">
                  {chf(pendingRequestedCents)}
                </span>{" "}
                <span className="text-white/60">(wartet auf Admin-Freigabe)</span>
              </div>
            </div>
          ) : availableCents <= 0 ? (
            <div className="text-white/65">
              Aktuell ist kein Betrag für eine Auszahlung verfügbar.
            </div>
          ) : (
            <div>
              Du kannst jetzt{" "}
              <span className="font-semibold text-white/92">
                {chf(availableCents)}
              </span>{" "}
              als Auszahlung anfragen{" "}
              <span className="text-white/60">(manuelle Freigabe durch Admin)</span>.
            </div>
          )}

          {msg ? (
            <div className="pt-1 text-white/88" aria-live="polite">
              {msg}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
