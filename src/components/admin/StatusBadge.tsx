import React from "react";

export function StatusBadge({ status }: { status: string }) {
  let color = "#888";
  let bg = "#f3f4f6";
  let label = status;
  switch (status) {
    case "PAID":
      color = "#15803d";
      bg = "#dcfce7";
      label = "Bezahlt";
      break;
    case "PENDING":
      color = "#6b7280";
      bg = "#f3f4f6";
      label = "Ausstehend";
      break;
    case "FAILED":
      color = "#b91c1c";
      bg = "#fee2e2";
      label = "Fehlgeschlagen";
      break;
    case "REFUNDED":
      color = "#2563eb";
      bg = "#dbeafe";
      label = "Erstattet";
      break;
    default:
      color = "#6b7280";
      bg = "#f3f4f6";
      label = status;
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        color,
        background: bg,
        letterSpacing: 0.2,
        minWidth: 70,
        textAlign: "center",
      }}
    >
      {label}
    </span>
  );
}
