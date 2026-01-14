import React from "react";

export function VendorEarningsCard({
  totalRevenueCents,
  platformFeeCents,
  vendorEarningsCents,
  orderCount,
  loading,
  error,
  onRetry,
}: {
  totalRevenueCents: number;
  platformFeeCents: number;
  vendorEarningsCents: number;
  orderCount: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  function formatCHF(cents: number) {
    return (cents / 100).toLocaleString("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 2,
    });
  }

  return (
    <div className="neo-surface rounded-3xl p-6 md:p-8 flex flex-col gap-4 md:gap-6 shadow-lg">
      <h2 className="text-lg md:text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
        Deine Einnahmen
      </h2>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-1/2 bg-gray-200 rounded" />
          <div className="h-5 w-1/3 bg-gray-100 rounded" />
          <div className="h-5 w-1/3 bg-gray-100 rounded" />
          <div className="h-5 w-1/4 bg-gray-100 rounded" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm flex flex-col gap-2">
          <span>Fehler beim Laden der Umsätze. Bitte versuche es erneut.</span>
          {onRetry && (
            <button className="neobtn ghost" onClick={onRetry}>
              Erneut versuchen
            </button>
          )}
        </div>
      ) : orderCount === 0 ? (
        <div className="text-sm text-[var(--color-text-muted)] flex flex-col gap-2">
          <span>Noch keine Verkäufe.</span>
          <a href="/marketplace" className="neobtn primary w-max mt-2">
            Produkt bewerben
          </a>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-end md:gap-8 gap-2">
            <div className="flex-1">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Gesamtumsatz</div>
              <div className="text-2xl font-bold text-[var(--color-accent)]">
                {formatCHF(totalRevenueCents)}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Plattformgebühr (20 %)</div>
              <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                {formatCHF(platformFeeCents)}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Dein Anteil</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCHF(vendorEarningsCents)}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Bezahlte Orders</div>
              <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                {orderCount}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)] border border-[var(--color-card-border)]">
            Auszahlungen erfolgen manuell durch den Admin. Bei Fragen wende dich bitte an den Support.
          </div>
        </>
      )}
    </div>
  );
}
