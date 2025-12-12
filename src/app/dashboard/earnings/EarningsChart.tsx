"use client";
import { useEffect, useRef } from "react";

// Dummy chart data
const data = Array.from({ length: 30 }, (_, i) => ({
  day: `Tag ${i + 1}`,
  value: Math.round(Math.random() * 50 + 10),
}));

export default function EarningsChart() {
  const ref = useRef<HTMLDivElement>(null);

  // Simple bar chart rendering
  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = "";
    data.forEach((d) => {
      const bar = document.createElement("div");
      bar.style.height = `${d.value * 2}px`;
      bar.style.width = "10px";
      bar.style.marginRight = "3px";
      bar.style.background = "linear-gradient(180deg, #6366f1 0%, #2563eb 100%)";
      bar.style.borderRadius = "6px";
      bar.style.display = "inline-block";
      bar.title = `${d.day}: CHF ${d.value}`;
      container.appendChild(bar);
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minHeight: 120,
        display: "flex",
        alignItems: "flex-end",
        overflowX: "auto",
        paddingBottom: 8,
        gap: 0,
      }}
      aria-label="Umsatz nach Tag Chart"
      tabIndex={0}
    />
  );
}
