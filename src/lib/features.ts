// Centralized feature flags
// Client-safe flags MUST be NEXT_PUBLIC_*
export const features = {
  admin: process.env.NEXT_PUBLIC_FEATURE_ADMIN === "true",
  community: process.env.NEXT_PUBLIC_FEATURE_COMMUNITY === "true",
  analytics: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === "true",
} as const;
