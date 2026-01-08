// scripts/smoke-prod.mjs
// Simple production smoke checks (no Playwright).
// Usage:
//   SMOKE_BASE_URL=https://... node scripts/smoke-prod.mjs
// Optional:
//   SMOKE_WHITE_LABEL_HOST=e2e.local
//   SMOKE_MARKETPLACE_HOST=mp-e2e.local
//   SMOKE_TIMEOUT_MS=8000

const BASE = (process.env.SMOKE_BASE_URL || "").replace(/\/+$/, "");
const WL_HOST = process.env.SMOKE_WHITE_LABEL_HOST || "";
const MP_HOST = process.env.SMOKE_MARKETPLACE_HOST || "";
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || "8000");

if (!BASE) {
  console.error("❌ SMOKE_BASE_URL is required (e.g. https://your-app.vercel.app)");
  process.exit(1);
}

const okSet = (...codes) => new Set(codes);

function withTimeout(promise, ms, label) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return promise(ac.signal).finally(() => clearTimeout(t)).catch((e) => {
    throw new Error(`${label} failed: ${e?.name || "Error"} ${e?.message || e}`);
  });
}

async function req(path, { host } = {}) {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  return withTimeout(async (signal) => {
    const headers = {};
    if (host) headers["host"] = host; // host-based tenant mapping
    const res = await fetch(url, { headers, redirect: "manual", signal });
    const loc = res.headers.get("location") || "";
    return { url, status: res.status, loc };
  }, TIMEOUT_MS, `GET ${url}${host ? ` (Host: ${host})` : ""}`);
}

function assertStatus(name, got, allowed) {
  if (!allowed.has(got)) {
    throw new Error(`❌ ${name}: unexpected status ${got} (allowed: ${Array.from(allowed).join(",")})`);
  }
}

function assertNot500(name, got) {
  if (got === 500) throw new Error(`❌ ${name}: got 500`);
}

async function run() {
  console.log("🧪 Smoke base:", BASE);
  if (WL_HOST) console.log("   WL host:", WL_HOST);
  if (MP_HOST) console.log("   MP host:", MP_HOST);

  // Global routes (no host header)
  {
    const r1 = await req("/marketplace");
    assertStatus("/marketplace", r1.status, okSet(200));
    console.log("✅ /marketplace", r1.status);

    const r2 = await req("/explore");
    assertStatus("/explore", r2.status, okSet(200));
    console.log("✅ /explore", r2.status);

    // should not 500 on nonsense ids (global marketplace routes)
    const r3 = await req("/seller/not-a-real-id");
    assertNot500("/seller/:id", r3.status);
    console.log("✅ /seller/not-a-real-id", r3.status);

    const r4 = await req("/product/not-a-real-id");
    assertNot500("/product/:id", r4.status);
    console.log("✅ /product/not-a-real-id", r4.status);
  }

  // Default host behavior for /shop (no Host header)
  {
    const r = await req("/shop");
    // allow redirects depending on your default tenant behavior
    assertStatus("/shop (default)", r.status, okSet(200, 302, 303, 307, 308, 404));
    assertNot500("/shop (default)", r.status);
    console.log("✅ /shop (default)", r.status, r.loc ? `-> ${r.loc}` : "");
  }

  // White-label host: /shop should be reachable (typically 200)
  if (WL_HOST) {
    const r = await req("/shop", { host: `${WL_HOST}` });
    assertStatus(`/shop (WL host ${WL_HOST})`, r.status, okSet(200, 302, 303, 307, 308));
    assertNot500(`/shop (WL host ${WL_HOST})`, r.status);
    console.log(`✅ /shop (WL ${WL_HOST})`, r.status, r.loc ? `-> ${r.loc}` : "");

    // Tenant vendor page should not 500 (404 ok)
    const r2 = await req("/vendors/not-a-real-id", { host: `${WL_HOST}` });
    assertNot500(`/vendors/:id (WL ${WL_HOST})`, r2.status);
    console.log(`✅ /vendors/not-a-real-id (WL ${WL_HOST})`, r2.status);
  }

  // Marketplace host: /shop should be blocked or redirect to /marketplace
  if (MP_HOST) {
    const r = await req("/shop", { host: `${MP_HOST}` });
    assertStatus(`/shop (MP host ${MP_HOST})`, r.status, okSet(404, 302, 303, 307, 308, 200));
    assertNot500(`/shop (MP host ${MP_HOST})`, r.status);

    if ([302, 303, 307, 308].includes(r.status)) {
      if (!r.loc.includes("/marketplace")) {
        throw new Error(`❌ /shop (MP ${MP_HOST}) redirected but location was not /marketplace: ${r.loc}`);
      }
    }
    console.log(`✅ /shop (MP ${MP_HOST})`, r.status, r.loc ? `-> ${r.loc}` : "");
  }

  console.log("🎉 Smoke OK");
}

run().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
