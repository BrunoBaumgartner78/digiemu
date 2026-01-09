// scripts/check-tenants.mjs
// Exit codes:
// 0: all sanity checks passed (localhost → digiemu)
// 2: localhost did not resolve to digiemu
// 3: unexpected runtime error

import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

const ROOT = process.cwd();
const TENANTS_PATH = path.join(ROOT, "config", "tenants.yml");

const CHECK_HOST = (process.env.TENANT_CHECK_HOST || "localhost").toLowerCase();
const EXPECT_KEY = process.env.TENANT_CHECK_EXPECT || "digiemu";

function loadTenantsFile() {
  if (!fs.existsSync(TENANTS_PATH)) {
    throw new Error(`[check:tenants] Missing file: ${TENANTS_PATH}`);
  }
  const raw = fs.readFileSync(TENANTS_PATH, "utf8");
  const cfg = yaml.parse(raw);

  if (!cfg || typeof cfg !== "object") throw new Error("[check:tenants] YAML parsed to non-object");
  if (!cfg.tenants || typeof cfg.tenants !== "object") throw new Error("[check:tenants] YAML missing 'tenants' object");

  return cfg;
}

function resolveTenantKeyByDomain(cfg, domain) {
  const d = String(domain || "").toLowerCase();
  for (const [key, tenant] of Object.entries(cfg.tenants)) {
    const domains = Array.isArray(tenant?.domains) ? tenant.domains : [];
    if (domains.some((x) => String(x).toLowerCase() === d)) return key;
  }
  return null;
}

try {
  const cfg = loadTenantsFile();
  const resolved = resolveTenantKeyByDomain(cfg, CHECK_HOST);

  console.log(`[check:tenants] host=${CHECK_HOST}`);
  console.log(`[check:tenants] resolved=${resolved}`);
  console.log(`[check:tenants] expected=${EXPECT_KEY}`);
  console.log(`[check:tenants] tenantsKeys=${Object.keys(cfg.tenants).join(",")}`);

  if (resolved !== EXPECT_KEY) {
    console.error(`[check:tenants] FAIL: ${CHECK_HOST} did not resolve to ${EXPECT_KEY}`);
    process.exit(2);
  }

  console.log("[check:tenants] OK");
  process.exit(0);
} catch (err) {
  console.error("[check:tenants] ERROR:", err?.stack || err?.message || err);
  process.exit(3);
}
