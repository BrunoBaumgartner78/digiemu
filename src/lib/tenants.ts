// src/lib/tenants.ts
import "server-only";

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export type VendorOnboarding = "OPEN_WITH_APPROVAL" | "ADMIN_ONLY" | "DB_ONLY";
export type CatalogMode = "FREE_ONLY" | "PAID_ONLY" | "MIXED";
export type Payments = "ON" | "OFF";
export type Visibility = "PUBLIC" | "MEMBERS_ONLY";

export type TenantConfig = {
	name: string;
	domains: string[];
	vendorOnboarding: VendorOnboarding;
	catalogMode: CatalogMode;
	payments: Payments;
	visibility: Visibility;
	branding?: {
		logoUrl?: string;
		primaryColor?: string;
		accentColor?: string;
	};
	legal?: {
		imprintUrl?: string;
		privacyUrl?: string;
	};
	features?: {
		showMarketplaceUI?: boolean;
		allowBundles?: boolean;
	};
};

export type TenantsConfig = {
	version: number;
	tenants: Record<string, TenantConfig>;
};

const TENANTS_YML_PATH = path.join(process.cwd(), "config", "tenants.yml");

// In PROD willst du NICHT still "DEFAULT" nehmen:
// - Next/Vercel: process.env.NODE_ENV === "production"
// - Override: TENANTS_STRICT=1
const STRICT =
	process.env.TENANTS_STRICT === "1" || process.env.NODE_ENV === "production";

const DEFAULT_CONFIG: TenantsConfig = {
	version: 1,
	tenants: {
		digiemu: {
			name: "DigiEmu",
			domains: ["localhost", "digiemu.vercel.app", "digiemu.ch", "www.digiemu.ch"],
			vendorOnboarding: "OPEN_WITH_APPROVAL",
			catalogMode: "MIXED",
			payments: "ON",
			visibility: "PUBLIC",
			branding: {
				logoUrl: "/logo.svg",
				primaryColor: "#8FB2FF",
				accentColor: "#2E6BFF",
			},
			legal: { imprintUrl: "/impressum", privacyUrl: "/datenschutz" },
			features: { showMarketplaceUI: true, allowBundles: true },
		},
	},
};

function isObj(v: unknown): v is Record<string, any> {
	return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizeDomain(d: string) {
	return String(d || "")
		.toLowerCase()
		.trim()
		.replace(/^https?:\/\//, "")
		.replace(/\/.*$/, "")
		.split(":")[0];
}

function coerceEnum<T extends string>(v: any, allowed: readonly T[], fallback: T): T {
	const s = String(v ?? "").trim() as T;
	return (allowed as readonly string[]).includes(s) ? s : fallback;
}

function validateConfig(raw: any): TenantsConfig | null {
	if (!isObj(raw)) return null;

	const version = Number(raw.version);
	const tenants = raw.tenants;

	if (!Number.isFinite(version)) return null;
	if (!isObj(tenants)) return null;

	const out: TenantsConfig = { version, tenants: {} };

	for (const [key, t] of Object.entries(tenants)) {
		if (!isObj(t)) continue;

		const name = typeof t.name === "string" ? t.name : key;

		const domainsRaw = Array.isArray(t.domains) ? t.domains : [];
		const domains = domainsRaw
			.map((d) => normalizeDomain(String(d)))
			.filter(Boolean);

		// domains ist Pflicht
		if (domains.length === 0) continue;

		const vendorOnboarding = coerceEnum<VendorOnboarding>(
			t.vendorOnboarding,
			["OPEN_WITH_APPROVAL", "ADMIN_ONLY", "DB_ONLY"] as const,
			"OPEN_WITH_APPROVAL"
		);

		const catalogMode = coerceEnum<CatalogMode>(
			t.catalogMode,
			["FREE_ONLY", "PAID_ONLY", "MIXED"] as const,
			"MIXED"
		);

		const payments = coerceEnum<Payments>(t.payments, ["ON", "OFF"] as const, "ON");

		const visibility = coerceEnum<Visibility>(
			t.visibility,
			["PUBLIC", "MEMBERS_ONLY"] as const,
			"PUBLIC"
		);

		const branding = isObj(t.branding)
			? {
					logoUrl: typeof t.branding.logoUrl === "string" ? t.branding.logoUrl : undefined,
					primaryColor:
						typeof t.branding.primaryColor === "string" ? t.branding.primaryColor : undefined,
					accentColor:
						typeof t.branding.accentColor === "string" ? t.branding.accentColor : undefined,
				}
			: undefined;

		const legal = isObj(t.legal)
			? {
					imprintUrl: typeof t.legal.imprintUrl === "string" ? t.legal.imprintUrl : undefined,
					privacyUrl: typeof t.legal.privacyUrl === "string" ? t.legal.privacyUrl : undefined,
				}
			: undefined;

		const features = isObj(t.features)
			? {
					showMarketplaceUI:
						typeof t.features.showMarketplaceUI === "boolean"
							? t.features.showMarketplaceUI
							: undefined,
					allowBundles:
						typeof t.features.allowBundles === "boolean" ? t.features.allowBundles : undefined,
				}
			: undefined;

		out.tenants[key] = {
			name,
			domains,
			vendorOnboarding,
			catalogMode,
			payments,
			visibility,
			branding,
			legal,
			features,
		};
	}

	if (Object.keys(out.tenants).length === 0) return null;
	return out;
}

let _cache: { mtimeMs: number; cfg: TenantsConfig } | null = null;

function failOrFallback(msg: string, err?: unknown): TenantsConfig {
	if (STRICT) {
		const detail = err ? (err as any)?.stack || String(err) : "";
		throw new Error(`${msg}${detail ? "\n" + detail : ""}`);
	}
	console.warn(msg, err ?? "");
	return DEFAULT_CONFIG;
}

/**
 * Robust loader with clear diagnostics:
 * - caches by mtime
 * - strict mode in production (or TENANTS_STRICT=1)
 */
export function loadTenantsConfig(): TenantsConfig {
	try {
		if (!fs.existsSync(TENANTS_YML_PATH)) {
			return failOrFallback(`[tenants] Missing ${TENANTS_YML_PATH} → using DEFAULT_CONFIG`);
		}

		const stat = fs.statSync(TENANTS_YML_PATH);
		if (_cache && _cache.mtimeMs === stat.mtimeMs) return _cache.cfg;

		const rawText = fs.readFileSync(TENANTS_YML_PATH, "utf8");
		const parsed = YAML.parse(rawText);

		if (!isObj(parsed)) {
			return failOrFallback("[tenants] YAML parsed to non-object → using DEFAULT_CONFIG");
		}

		// Helpful debug (no more "parsed keys: null")
		const parsedKeys = isObj(parsed.tenants) ? Object.keys(parsed.tenants) : [];
		console.log("[tenants] parsed keys:", parsedKeys.length ? parsedKeys : "(none)");

		const cfg = validateConfig(parsed);
		if (!cfg) {
			return failOrFallback("[tenants] Invalid YAML structure → using DEFAULT_CONFIG");
		}

		console.log("[tenants] loaded keys:", Object.keys(cfg.tenants));
		_cache = { mtimeMs: stat.mtimeMs, cfg };
		return cfg;
	} catch (e) {
		return failOrFallback("[tenants] Failed to load/parse → using DEFAULT_CONFIG", e);
	}
}

export function getTenantByDomain(
	domain: string | null | undefined
): { key: string; tenant: TenantConfig } | null {
	const cfg = loadTenantsConfig();
	const d = normalizeDomain(domain || "");

	for (const [key, tenant] of Object.entries(cfg.tenants)) {
		if (tenant.domains.some((x) => normalizeDomain(x) === d)) {
			return { key, tenant };
		}
	}
	return null;
}

export function getTenantKeyByDomain(domain: string | null | undefined, fallback = "digiemu") {
	return getTenantByDomain(domain)?.key ?? fallback;
}

