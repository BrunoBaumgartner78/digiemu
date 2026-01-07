(async () => {
  const secret = process.env.E2E_ADMIN_SECRET || '';
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@bellu.ch';
  const tenantId = process.env.E2E_TENANT_ID || '';
  if (!secret) {
    console.error('E2E_ADMIN_SECRET not set in env');
    process.exit(2);
  }
  if (!tenantId) {
    console.error('E2E_TENANT_ID not set in env');
    process.exit(2);
  }
  try {
    const res = await fetch('http://localhost:3000/api/admin/tenants/update', {
      method: 'POST',
      headers: {
        'x-e2e-admin': '1',
        'x-e2e-secret': secret,
        'x-e2e-email': email,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ tenantId, name: 'E2E-Admin-Test' }),
    });
    console.log('status', res.status);
    try {
      const j = await res.json();
      console.log('json', j);
    } catch (e) {
      console.log('no json body');
    }
  } catch (err) {
    console.error('request failed', err);
    process.exit(1);
  }
})();
