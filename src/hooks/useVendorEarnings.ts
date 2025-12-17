import { useCallback, useEffect, useState } from "react";

export function useVendorEarnings() {
  const [data, setData] = useState<null | {
    totalRevenueCents: number;
    platformFeeCents: number;
    vendorEarningsCents: number;
    orderCount: number;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/earnings");
      if (!res.ok) throw new Error("Fehler beim Laden der Daten");
      const json = await res.json();
      setData({
        totalRevenueCents: json.totalEarningsCents,
        platformFeeCents: json.platformFeeCents,
        vendorEarningsCents: json.vendorEarningsCents,
        orderCount: json.ordersCount,
      });
    } catch (e) {
      setError("Fehler beim Laden der Umsätze.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return { ...data, loading, error, refetch: fetchEarnings };
}
