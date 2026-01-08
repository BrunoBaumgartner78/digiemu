// Global tenant key used for platform-wide marketplace pages & queries
export const MARKETPLACE_TENANT_KEY = "DEFAULT" as const;

// Helper to return a stable marketplace tenant object.
// Reads `process.env.MARKETPLACE_TENANT_KEY` as an override if present.
export async function marketplaceTenant() {
  const envKey = String(process.env.MARKETPLACE_TENANT_KEY ?? "").trim();
  const key = envKey || MARKETPLACE_TENANT_KEY;
  return { key } as const;
}
