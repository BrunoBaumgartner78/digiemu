import { loadTenantsConfig, getTenantByDomain } from "../src/lib/tenants";

async function main() {
  try {
    const cfg = loadTenantsConfig();
    console.log("Loaded tenants keys:", Object.keys(cfg.tenants));

    // sanity checks
    const localhost = getTenantByDomain("localhost");
    console.log("getTenantByDomain('localhost') =>", localhost ? localhost.key : null);

    const bellu = getTenantByDomain("bellu.ch");
    console.log("getTenantByDomain('bellu.ch') =>", bellu ? bellu.key : null);

    // basic expectations
    const okLocal = localhost?.key === "digiemu";
    const okBellu = Boolean(bellu && bellu.key === "bellu");

    if (!okLocal) {
      console.error("Sanity: localhost did not resolve to 'digiemu'");
    }
    if (!okBellu) {
      console.warn("Sanity: bellu.ch did not resolve to 'bellu' (ok if you don't have it)");
    }

    const exitCode = okLocal ? 0 : 2;
    process.exit(exitCode);
  } catch (e) {
    console.error("Failed to run tenants sanity check:", e);
    process.exit(3);
  }
}

main();
