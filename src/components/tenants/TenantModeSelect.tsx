"use client";

import * as React from "react";

export type TenantMode = "WHITE_LABEL" | "MARKETPLACE";

const OPTIONS: Array<{ value: TenantMode; label: string; hint: string }> = [
  {
    value: "WHITE_LABEL",
    label: "White-Label Shop",
    hint: "Eigener Shop — keine Multi-Vendor Funktionen.",
  },
  {
    value: "MARKETPLACE",
    label: "Content OS",
    hint: "Mehrere Verkäufer, Content OS-Funktionen.",
  },
];

export default function TenantModeSelect({
  name = "mode",
  value,
  defaultValue = "WHITE_LABEL",
  onChange,
  disabled,
}: {
  name?: string;
  value?: TenantMode;
  defaultValue?: TenantMode;
  onChange?: (v: TenantMode) => void;
  disabled?: boolean;
}) {
  const current = value ?? defaultValue;
  const hint = OPTIONS.find((o) => o.value === current)?.hint ?? "";

  const selectProps =
    value !== undefined
      ? { value } // ✅ controlled
      : { defaultValue }; // ✅ uncontrolled

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label
        style={{
          fontSize: 12,
          opacity: 0.75,
          marginLeft: 8,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        Shop-Modus
      </label>

      <select
        name={name}
        disabled={disabled}
        className="neo-input"
        style={{ width: "100%", borderRadius: 999 }}
        {...selectProps}
        onChange={(e) => onChange?.(e.target.value as TenantMode)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div style={{ fontSize: 12, opacity: 0.72, marginLeft: 8, lineHeight: 1.5 }}>
        {hint}
      </div>
    </div>
  );
}
