"use client";

type Props = {
  status?: string | null;
  isPublic?: boolean | null;
};

export default function VendorProfileGateCard({ status, isPublic }: Props) {
  const s = (status ?? "UNKNOWN").toUpperCase();
  const pub = !!isPublic;
  const approved = s === "APPROVED";

  const canSell = approved && pub;

  const reasons: string[] = [];
  if (!approved) reasons.push("Profil noch nicht freigeschaltet (APPROVED fehlt)");
  if (!pub) reasons.push("Profil ist nicht öffentlich (isPublic=false)");

  return (
    <div className="rounded-3xl bg-[var(--neo-card-bg-soft)] border border-[var(--neo-card-border)] shadow-[var(--neo-card-shadow-soft)] p-4 md:p-6">
      <div className="text-xs text-[var(--text-muted)] mb-1">Vendor Status</div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="text-sm text-[var(--text-main)]">
            Profil: <span className="font-semibold">{s}</span> · <span className="font-semibold">{pub ? "public" : "private"}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {canSell
              ? "✅ Du kannst Produkte erstellen und im Marketplace anzeigen."
              : "⛔ Produkte sind aktuell nicht öffentlich sichtbar."}
          </div>
        </div>
      </div>

      {!canSell && reasons.length > 0 ? (
        <div className="mt-3 text-xs text-[var(--text-muted)]">Gründe: {reasons.join(" · ")}</div>
      ) : null}
    </div>
  );
}
