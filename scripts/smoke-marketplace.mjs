// super-light smoke test (no deps)
const base = process.env.BASE_URL || "http://localhost:3000";

async function hit(path) {
  const url = base.replace(/\/$/, "") + path;
  const res = await fetch(url, { redirect: "manual" });
  const ct = res.headers.get("content-type") || "";
  if (res.status >= 200 && res.status < 400) {
    console.log(`✅ ${res.status} ${path}  (${ct})`);
    return true;
  }
  console.log(`❌ ${res.status} ${path}  (${ct})`);
  return false;
}

async function main() {
  let ok = true;
  ok = (await hit("/marketplace")) && ok;
  ok = (await hit("/explore")) && ok;
  console.log("Done.");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("❌ error", e?.message || e);
  process.exit(1);
});
