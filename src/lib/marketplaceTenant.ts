// Global tenant key used for platform-wide marketplace pages & queries
export const MARKETPLACE_TENANT_KEY = "MARKETPLACE" as const;

// In current data, products may still live under DEFAULT.
// Allow an override and a fallback list for queries.
export function marketplaceTenant() {
  const key =
    String(process.env.MARKETPLACE_TENANT_KEY ?? MARKETPLACE_TENANT_KEY).trim() ||
    MARKETPLACE_TENANT_KEY;

  const fallbackKeys = String(process.env.MARKETPLACE_TENANT_FALLBACK_KEYS ?? "DEFAULT")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return { key, fallbackKeys } as const;
}
