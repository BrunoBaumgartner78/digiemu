"use client";

import { useEffect, useRef } from "react";

type Point = { day: string; value: number };

const data: Point[] = Array.from({ length: 30 }, (_, i) => ({
  day: `Tag ${i + 1}`,
  value: Math.round(Math.random() * 50 + 10),
}));

export default function EarningsChart() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = "";

    data.forEach((d) => {
      const bar = document.createElement("div");
      bar.style.height = `${d.value * 2}px`;
      bar.style.width = "10px";
      bar.style.marginRight = "3px";
      bar.style.borderRadius = "6px";
      bar.style.display = "inline-block";
      bar.style.background =
        "linear-gradient(180deg, rgba(99,102,241,0.95) 0%, rgba(37,99,235,0.95) 100%)";
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
      }}
      aria-label="Umsatz nach Tag Chart"
      tabIndex={0}
    />
  );
}
