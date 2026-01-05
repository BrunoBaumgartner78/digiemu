import fs from "fs-extra";
import path from "path";
import yaml from "yaml";

export type CatalogMode = "FREE_ONLY" | "PAID_ONLY" | "MIXED";
export type VendorOnboarding = "OPEN_WITH_APPROVAL" | "ADMIN_ONLY" | "DB_ONLY";
export type Payments = "ON" | "OFF";
export type Visibility = "PUBLIC" | "MEMBERS_ONLY";

export interface TenantBranding {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

export interface TenantLegal {
  imprintUrl: string;
  privacyUrl: string;
}

export interface TenantFeatures {
  showMarketplaceUI: boolean;
  allowBundles: boolean;
}

export interface TenantConfig {
  name: string;
  domains: string[];
  vendorOnboarding: VendorOnboarding;
  catalogMode: CatalogMode;
  payments: Payments;
  visibility: Visibility;
  branding: TenantBranding;
  legal: TenantLegal;
  features: TenantFeatures;
}

export interface TenantsConfig {
  version: number;
  tenants: Record<string, TenantConfig>;
}

const TENANTS_PATH = path.join(process.cwd(), "config", "tenants.yml");

let cached: TenantsConfig | null = null;

export function loadTenantsConfig(): TenantsConfig {
  if (!cached) {
    const raw = fs.readFileSync(TENANTS_PATH, "utf8");
    cached = yaml.parse(raw) as TenantsConfig;
  }
  return cached!;
}

export function normalizeHost(host: string) {
  // remove port, lowercase
  return host.split(":")[0].trim().toLowerCase();
}

export function getTenantConfigByDomain(domain: string): { key: string; tenant: TenantConfig } | null {
  const cfg = loadTenantsConfig();
  const d = normalizeHost(domain);

  for (const [key, tenant] of Object.entries(cfg.tenants)) {
    if ((tenant.domains ?? []).map(normalizeHost).includes(d)) {
      return { key, tenant };
    }
  }
  return null;
}

/**
 * Convenience helper for API routes.
 * Uses request headers host OR x-forwarded-host.
 */
export function getTenantFromRequest(req: Request): { key: string; tenant: TenantConfig } | null {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";

  if (!host) return null;

  // For local dev, you may also access via 127.0.0.1
  // If needed, add it to YAML. We keep logic strict here.
  return getTenantConfigByDomain(host);
}
