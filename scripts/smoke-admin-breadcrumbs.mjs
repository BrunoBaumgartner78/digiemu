// super-light smoke: admin route should redirect when not logged in
const base = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const url = base.replace(/\/$/, "") + "/admin/tenants";
  const res = await fetch(url, { redirect: "manual" });

  // expected: 307 to /login (or 302 depending on setup)
  if (res.status === 302 || res.status === 307) {
    console.log(`✅ ${res.status} /admin/tenants`);
    console.log("Done.");
    process.exit(0);
  }

  console.log(`❌ ${res.status} /admin/tenants`);
  console.log("Done.");
  process.exit(1);
}

main().catch((e) => {
  console.error("❌ fetch failed", e?.message || e);
  process.exit(1);
});
const base = process.env.BASE_URL || "http://localhost:3000";

async function check(path) {
  const res = await fetch(base + path, { redirect: "manual" });
  const ct = res.headers.get("content-type") || "";
  const html = ct.includes("text/html") ? await res.text() : "";

  // crude but effective: make sure the rendered HTML doesn't contain "/["
  if (html.includes('href="/admin/tenants/[') || html.includes("href=\"/admin/tenants/[")) {
    throw new Error(`Found dynamic href in HTML for ${path}`);
  }

  console.log(`✅ ${res.status} ${path}`);
}

(async () => {
  try {
    // adjust if /admin requires auth; then expect redirect 307/308 to /login
    await check("/admin/tenants");
    console.log("Done.");
    process.exit(0);
  } catch (e) {
    console.error("❌", e.message || e);
    process.exit(1);
  }
})();
