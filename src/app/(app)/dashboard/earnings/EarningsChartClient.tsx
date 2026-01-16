"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const EarningsChart = dynamic(() => import("./EarningsChart"), { ssr: false });

export default function EarningsChartClient(
  props: ComponentProps<typeof EarningsChart>
) {
  return <EarningsChart {...props} />;
}
