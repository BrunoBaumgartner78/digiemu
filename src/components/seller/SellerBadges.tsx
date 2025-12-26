import React from "react";
import { getBadgesFromVendorProfile, type Badge } from "@/lib/trustBadges";
import { Check, Sparkles, Star, Bolt } from "lucide-react";

type Props = { vendorProfile?: any; max?: number };

function iconForBadge(id: string) {
  switch (id) {
    case "verified_vendor":
      return <Check size={14} />;
    case "trusted_vendor":
      return <Star size={14} />;
    case "first_sales":
      return <Sparkles size={14} />;
    case "fast_delivery":
      return <Bolt size={14} />;
    default:
      return <Sparkles size={14} />;
  }
}

export default function SellerBadges({ vendorProfile, max = 3 }: Props) {
  const badges: Badge[] = getBadgesFromVendorProfile(vendorProfile ?? {});
  if (!badges || badges.length === 0) return null;

  const visible = badges.slice(0, max);
  const rest = badges.length - visible.length;

  return (
    <div role="list" aria-label="Verkäufer-Badges" style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {visible.map((b) => (
        <div key={b.id} role="listitem" title={b.tooltip} style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "#f6fbff", borderRadius: 8, fontSize: 13 }}>
          <span aria-hidden style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}>{iconForBadge(b.id)}</span>
          <span style={{ fontWeight: 700 }}>{b.label}</span>
        </div>
      ))}

      {rest > 0 && (
        <div title={badges.slice(max).map((x) => `${x.label}: ${x.tooltip}`).join("\n")} style={{ padding: "6px 8px", background: "#fff", borderRadius: 8, fontSize: 13 }}>
          +{rest}
        </div>
      )}
    </div>
  );
}
