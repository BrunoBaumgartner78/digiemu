type QSValue = string | number | boolean | null | undefined;

export function buildQueryString(overrides: Record<string, QSValue>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  // Return without leading `?` to match existing callers that prefix it.
  return params.toString();
}
