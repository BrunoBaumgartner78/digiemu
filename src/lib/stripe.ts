import Stripe from "stripe";

// NOTE:
// The Stripe SDK types sometimes pin `apiVersion` to a single literal (e.g. "2025-12-15.clover").
// To prevent CI breakage when the SDK updates its literal, we keep runtime stable and make TS robust.

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");

  // Prefer env override, otherwise use the version expected by the currently installed typings.
  const apiVersion = process.env.STRIPE_API_VERSION || "2025-12-15.clover";

  _stripe = new Stripe(key, {
    // Cast for TS stability across Stripe SDK releases.
    apiVersion: apiVersion as any,
  });

  return _stripe;
}
