// src/lib/branding/text.ts
import { brandingConfig } from "@/lib/branding/config";

export const brand = {
  mpLabelDE: brandingConfig.ui.navigation.marketplace.label.de,
  mpLabelEN: brandingConfig.ui.navigation.marketplace.label.en,
  canonicalDE: brandingConfig.product.positioning.canonical.de,
  canonicalEN: brandingConfig.product.positioning.canonical.en,
} as const;
