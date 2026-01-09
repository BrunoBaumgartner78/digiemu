"use client";

import * as React from "react";
import { LEGAL } from "@/lib/legal";

export default function DigitalConsent({
  value,
  onChange,
  compact,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div className="neo-card" style={{ padding: 12, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          aria-label="Zustimmung digitale Inhalte"
          style={{ marginTop: 3 }}
        />
        <div style={{ fontSize: 13, lineHeight: 1.35, opacity: 0.95 }}>
          <strong>Digitale Inhalte</strong>
          <div style={{ opacity: 0.8, marginTop: 4 }}>{LEGAL.digitalGoodsWithdrawalEU}</div>
          {!compact && (
            <div style={{ opacity: 0.75, marginTop: 8 }}>
              {LEGAL.digitalGoodsNoRefundPolicy}
              <div style={{ marginTop: 6 }}>
                Support:{" "}
                <a className="neo-link" href={`mailto:${LEGAL.supportEmail}`}>
                  {LEGAL.supportEmail}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
