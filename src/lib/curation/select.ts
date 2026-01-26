/**
 * Einheitliche Selects damit Seiten nicht "driften".
 * Passe fields an, falls du andere UI brauchst.
 */
export const productCardSelect = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  thumbnail: true,
  category: true,
  status: true,
  isActive: true,
  createdAt: true,
  vendorId: true,
  vendor: { select: { id: true, email: true, name: true, isBlocked: true } },
  vendorProfile: { select: { id: true, slug: true, displayName: true, isPublic: true } },
} as const;
