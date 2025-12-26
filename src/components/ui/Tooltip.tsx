"use client";

import React from "react";

export default function Tooltip({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  const aid = id ?? `tooltip-${Math.random().toString(36).slice(2, 9)}`;
  const [show, setShow] = React.useState(false);

  return (
    <span style={{ display: "inline-block", position: "relative" }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span tabIndex={0} aria-describedby={aid} style={{ outline: "none" }} onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
        {children}
      </span>
      {show && (
        <span
          role="tooltip"
          id={aid}
          style={{
            position: "absolute",
            bottom: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(2,6,23,0.9)",
            color: "#fff",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: "nowrap",
            zIndex: 60,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
