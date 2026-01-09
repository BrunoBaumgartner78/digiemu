export function formatMoneyCents(cents: number, currency: string = "CHF", locale: string = "de-CH") {
  const value = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export default formatMoneyCents;
