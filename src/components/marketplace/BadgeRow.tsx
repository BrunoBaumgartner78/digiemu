import React from "react";
import { Check, Sparkles, Star, Bolt } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";

const ICON_MAP: Record<string, React.ReactNode> = {
  verified_vendor: <Check size={14} />,
  first_sales: <Sparkles size={14} />,
  trusted_vendor: <Star size={14} />,
  fast_delivery: <Bolt size={14} />,
};

export default function BadgeRow({ badges, max = 2 }: { badges?: { id: string; label: string; tooltip: string }[] | null; max?: number }) {
  if (!badges || badges.length === 0) return null;
  const visible = badges.slice(0, max);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
      {visible.map((b) => (
        <Tooltip key={b.id} label={b.tooltip}>
          <div
            tabIndex={0}
            style={{
              fontSize: 11,
              padding: "4px 6px",
              borderRadius: 999,
              background: "rgba(2,6,23,0.04)",
              color: "var(--text-muted)",
              opacity: 0.95,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "default",
            }}
            aria-label={b.tooltip}
          >
            <span style={{ display: "inline-flex", width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
              {ICON_MAP[b.id] ?? null}
            </span>
            <span style={{ fontWeight: 700 }}>{b.label}</span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
