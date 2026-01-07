(async ()=>{
  const hosts = ['localhost:3000','e2e.local:3000'];
  for (const h of hosts) {
    try {
      const res = await fetch('http://localhost:3000/shop', { headers: { host: h } });
      const t = await res.text();
      const m = t.match(/<meta name="x-tenant-key" content="([^"]+)"/);
      const d = t.match(/<html[^>]*data-tenant="([^"]+)"/);
      console.log({ host: h, status: res.status, meta: m ? m[1] : null, dataTenant: d ? d[1] : null });
    } catch (err) {
      console.error('error', h, err);
    }
  }
})();
