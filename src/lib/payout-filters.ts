export type PayoutFilters = {
  status?: string | undefined; // PENDING|PAID|CANCELLED
  vendorId?: string | undefined;
  dateFrom?: string | undefined; // ISO date
  dateTo?: string | undefined; // ISO date
  q?: string | undefined;
  page?: number | undefined;
};

export function parsePayoutSearchParams(sp: Record<string, string | string[] | undefined>): PayoutFilters {
  const first = (v?: string | string[] | undefined) => (typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined);
  const rawStatus = first(sp.status)?.trim();
  const status = rawStatus && rawStatus !== 'ALL' ? rawStatus : undefined;
  const vendorId = first(sp.vendorId)?.trim() || undefined;
  const dateFrom = first(sp.from)?.trim() || undefined;
  const dateTo = first(sp.to)?.trim() || undefined;
  const q = first(sp.q)?.trim() || undefined;
  const page = Number(first(sp.page) ?? 1) || 1;
  return { status, vendorId, dateFrom, dateTo, q, page };
}

export function serializePayoutFilters(f: PayoutFilters) {
  const params = new URLSearchParams();
  if (f.status) params.set('status', f.status);
  if (f.vendorId) params.set('vendorId', f.vendorId);
  if (f.dateFrom) params.set('from', f.dateFrom);
  if (f.dateTo) params.set('to', f.dateTo);
  if (f.q) params.set('q', f.q);
  if (f.page && f.page > 1) params.set('page', String(f.page));
  return params.toString();
}
