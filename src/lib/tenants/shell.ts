// src/lib/tenants/shell.ts
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { normalizeTenantMode } from "@/lib/tenantMode";

export type TenantShellConfig = {
  logoUrl?: string | null;
  homeUrl?: string | null;
  showRegister?: boolean;
  showPoweredBy?: boolean;
  showAuthLinks?: boolean;
  showLogo?: boolean;
  poweredByEnabled?: boolean;
  poweredByUrl?: string | null;
  siteName?: string;
};

export type LandingVariant = "DEFAULT" | "GRID";
export type TenantLandingConfig = {
  landingVariant: LandingVariant;
  title?: string | null;
  subtitle?: string | null;
  featuredProductIds?: string[] | undefined;
};

/**
 * Resolve landing configuration from tenant.themeJson.shell with safe defaults.
 */
export function resolveLandingConfig(tenant: { themeJson?: any } | null | undefined): TenantLandingConfig {
  const t = tenant?.themeJson && typeof tenant?.themeJson === "object" ? tenant!.themeJson : {} as any;
  const shell = t.shell && typeof t.shell === "object" ? t.shell : {};

  const raw = typeof shell.landing === "string" ? shell.landing.toUpperCase().trim() : undefined;
  const landingVariant: LandingVariant = raw === "GRID" ? "GRID" : "DEFAULT";

  const title = typeof shell.landingTitle === "string" && shell.landingTitle.trim() ? shell.landingTitle.trim() : null;
  const subtitle = typeof shell.landingSubtitle === "string" && shell.landingSubtitle.trim() ? shell.landingSubtitle.trim() : null;

  let featured: string[] | undefined = undefined;
  if (Array.isArray(shell.featuredProductIds)) {
    const arr = shell.featuredProductIds.filter((x: any) => typeof x === "string" && x.trim()).map((s: string) => s.trim());
    if (arr.length > 0) featured = arr;
  }

  return { landingVariant, title, subtitle, featuredProductIds: featured };
}


/**
 * Derive a safe shell configuration from a tenant's theme JSON and optional tenant row
 * providing conservative defaults so white-label tenants render sensibly.
 */
export function getTenantShellConfig(themeJson?: any, tenantRow?: { logoUrl?: string | null }): TenantShellConfig {
  const t = themeJson && typeof themeJson === "object" ? themeJson : {};

  const logoFromRow = tenantRow?.logoUrl ?? null;
  const logoFromTheme = typeof t.logoUrl === "string" && t.logoUrl.trim() ? t.logoUrl.trim() : null;

  return {
    logoUrl: logoFromRow || logoFromTheme || null,
    homeUrl: typeof t.homeUrl === "string" && t.homeUrl.trim() ? t.homeUrl.trim() : null,
    showRegister: typeof t.showRegister === "boolean" ? t.showRegister : true,
    showPoweredBy: typeof t.showPoweredBy === "boolean" ? t.showPoweredBy : true,
    showAuthLinks: typeof t.showAuthLinks === "boolean" ? t.showAuthLinks : true,
    showLogo: typeof t.showLogo === "boolean" ? t.showLogo : true,
    poweredByEnabled: typeof t.poweredBy === "boolean" ? t.poweredBy : true,
    poweredByUrl: typeof t.poweredByUrl === "string" && t.poweredByUrl.trim() ? t.poweredByUrl.trim() : null,
    siteName: typeof t.siteName === "string" && t.siteName.trim() ? t.siteName.trim() : "DigiEmu",
  };
}

export type ShellVariant = "DEFAULT" | "MINIMAL";
export type FooterVariant = "DEFAULT" | "POWERED_BY_ONLY";

export async function resolveTenantShell(tenantKey: string) {
  const resolved = await resolveTenantWithCapabilities(tenantKey);
  const tenant = resolved.tenant as any;

  const mode = normalizeTenantMode(tenant.mode ?? "WHITE_LABEL");
  const cfg = (tenant.themeJson ?? {}) as any;

  // Marketplace never uses tenant shell overrides
  if (mode === "MARKETPLACE") {
    return { mode, shellVariant: "DEFAULT" as ShellVariant, footerVariant: "DEFAULT" as FooterVariant, cfg };
  }

  const shellVariant = cfg?.shellVariant === "MINIMAL" ? "MINIMAL" : "DEFAULT";
  const footerVariant = cfg?.footerVariant === "POWERED_BY_ONLY" ? "POWERED_BY_ONLY" : "DEFAULT";

  return { mode, shellVariant, footerVariant, cfg } as const;
}

export type HeaderMode = "DEFAULT" | "SHOP_ONLY" | "HIDDEN";
export type FooterMode = "DEFAULT" | "MINIMAL" | "HIDDEN";

/**
 * Normalized tenant shell settings derived from `tenant.themeJson.shell` with safe defaults.
 */
export function getTenantShell(themeJson?: any, tenantRow?: { logoUrl?: string | null; mode?: string }) {
  const t = themeJson && typeof themeJson === "object" ? themeJson : {};

  const mode = normalizeTenantMode(tenantRow?.mode ?? "WHITE_LABEL");

  // Defaults: white-label tenants get SHOP_ONLY header by default, marketplace uses DEFAULT
  const defaultHeader: HeaderMode = mode === "WHITE_LABEL" ? "SHOP_ONLY" : "DEFAULT";
  const defaultFooter: FooterMode = mode === "WHITE_LABEL" ? "MINIMAL" : "DEFAULT";

  const shell = (t.shell && typeof t.shell === "object") ? t.shell : {};

  const headerMode = (typeof shell.headerMode === "string" && ["DEFAULT","SHOP_ONLY","HIDDEN"].includes(shell.headerMode))
    ? (shell.headerMode as HeaderMode)
    : defaultHeader;

  const footerMode = (typeof shell.footerMode === "string" && ["DEFAULT","MINIMAL","HIDDEN"].includes(shell.footerMode))
    ? (shell.footerMode as FooterMode)
    : defaultFooter;

  const logoFromRow = tenantRow?.logoUrl ?? null;
  const logoFromTheme = typeof shell.logoUrl === "string" && shell.logoUrl.trim() ? shell.logoUrl.trim() : null;

  return {
    headerMode,
    footerMode,
    logoUrl: logoFromRow || logoFromTheme || null,
    homePath: typeof shell.homePath === "string" && shell.homePath.trim() ? shell.homePath.trim() : null,
    showAuthLinks: typeof shell.showAuthLinks === "boolean" ? shell.showAuthLinks : true,
    showRegister: typeof shell.showRegister === "boolean" ? shell.showRegister : true,
    showLogo: typeof shell.showLogo === "boolean" ? shell.showLogo : true,
    poweredByEnabled: typeof shell.poweredBy === "boolean" ? shell.poweredBy : true,
    poweredByUrl: typeof shell.poweredByUrl === "string" && shell.poweredByUrl.trim() ? shell.poweredByUrl.trim() : "https://bellu.ch",
  } as const;
}

// Compatibility helper: derive simple header/footer variants from normalized tenant shell
export function resolveShellConfig(tenant: { themeJson?: any; logoUrl?: string | null; mode?: string } | null | undefined) {
  const t = tenant ?? null;
  const normalized = getTenantShell(t?.themeJson, { logoUrl: t?.logoUrl, mode: t?.mode });
  const headerVariant: "DEFAULT" | "MINIMAL" = normalized.headerMode === "DEFAULT" ? "DEFAULT" : "MINIMAL";
  const footerVariant: "DEFAULT" | "MINIMAL" = normalized.footerMode === "DEFAULT" ? "DEFAULT" : "MINIMAL";
  return { headerVariant, footerVariant, hideMarketingLinks: normalized.footerMode === "MINIMAL" };
}

export type ShellUiConfig = {
  headerVariant: "DEFAULT" | "SHOP_MINIMAL";
  footerVariant: "DEFAULT" | "POWERED_BY";
  showAuthLinks: boolean;
  showNavLinks: boolean;
  logoUrl?: string | null;
};

/**
 * Resolve UI-related shell config from tenant.themeJson with conservative defaults.
 */
export function resolveShellUiConfig(tenant: { themeJson?: any; logoUrl?: string | null; mode?: string } | null | undefined): ShellUiConfig {
  const t = tenant ?? null;
  const shell = (t?.themeJson && typeof t.themeJson === 'object' && t.themeJson.shell && typeof t.themeJson.shell === 'object') ? t.themeJson.shell : {} as any;

  const rawHeader = typeof shell.headerVariant === 'string' ? shell.headerVariant.toUpperCase().trim() : undefined;
  const headerVariant = rawHeader === 'SHOP_MINIMAL' ? 'SHOP_MINIMAL' : 'DEFAULT';

  const rawFooter = typeof shell.footerVariant === 'string' ? shell.footerVariant.toUpperCase().trim() : undefined;
  const footerVariant = rawFooter === 'POWERED_BY' ? 'POWERED_BY' : 'DEFAULT';

  const showAuthLinks = typeof shell.showAuthLinks === 'boolean' ? shell.showAuthLinks : true;
  const showNavLinks = typeof shell.showNavLinks === 'boolean' ? shell.showNavLinks : true;

  const logoUrl = (t?.themeJson && typeof t.themeJson === 'object' && t.themeJson.branding && typeof t.themeJson.branding.logoUrl === 'string')
    ? t.themeJson.branding.logoUrl.trim() || t?.logoUrl || null
    : t?.logoUrl ?? null;

  return { headerVariant, footerVariant, showAuthLinks, showNavLinks, logoUrl };
}

export default {} as const;
