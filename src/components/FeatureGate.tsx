"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { features } from "@/lib/features";

type Props = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

// NOTE: This component adds an ADMIN bypass for the "admin" feature
// so site administrators can always access admin UI in MVP.
export default function FeatureGate({ feature, children, fallback = null }: Props) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  // Admin bypass: admins always see admin feature
  if (feature === "admin" && isAdmin) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[FeatureGate] bypass for ADMIN", { feature, role });
    }
    return <>{children}</>;
  }

  // Existing gating logic (fallback to NEXT_PUBLIC_FEATURE_* env vars)
  const isEnabled =
    typeof globalThis.__FEATURES__?.[feature] === "boolean"
      ? globalThis.__FEATURES__[feature]
      : process.env["NEXT_PUBLIC_FEATURE_" + feature.toUpperCase()] === "1" ||
        process.env["NEXT_PUBLIC_FEATURE_" + feature.toUpperCase()] === "true";

  if (process.env.NODE_ENV !== "production") {
    console.log("[FeatureGate] decision", { feature, role, isEnabled });
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}
