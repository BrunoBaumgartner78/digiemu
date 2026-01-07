"use client";

import React, { useId, useMemo, useState } from "react";

type TooltipProps = {
  label: string;
  children: React.ReactNode;
};

export default function Tooltip({ label, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  // ✅ React 18: stabil zwischen SSR und Client -> verhindert Hydration mismatch
  const reactId = useId();

  // Optional: schöneres DOM id format
  const aid = useMemo(() => `tooltip-${reactId.replace(/:/g, "")}`, [reactId]);

  return (
    <span
      style={{ display: "inline-block", position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={show ? aid : undefined}
        style={{ outline: "none" }}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        {children}
      </span>

      {show && (
        <span
          id={aid}
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            whiteSpace: "nowrap",
            zIndex: 50,
            background: "rgba(0,0,0,0.75)",
            color: "white",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
