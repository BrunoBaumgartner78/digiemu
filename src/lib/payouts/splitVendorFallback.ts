export function splitVendorFallback(order: {
  amountCents: number;
  vendorEarningsCents: number | null;
  platformEarningsCents: number | null;
}) {
  const amount = order.amountCents || 0;
  const v = order.vendorEarningsCents ?? 0;
  const p = order.platformEarningsCents ?? 0;

  // If earnings not stored yet, compute 80/20 from amount
  if (v === 0 && p === 0 && amount > 0) {
    const platform = Math.round(amount * 0.2);
    const vendor = amount - platform;
    return vendor;
  }
  return v;
}
