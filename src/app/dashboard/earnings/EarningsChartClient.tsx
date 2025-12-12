"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

// Das echte Chart ist vermutlich eine Client-Komponente
const EarningsChart = dynamic(() => import("./EarningsChart"), {
  ssr: false,
});

// Wrapper, damit page.tsx Server Component bleiben kann
export default function EarningsChartClient(
  props: ComponentProps<typeof EarningsChart>
) {
  return <EarningsChart {...props} />;
}
