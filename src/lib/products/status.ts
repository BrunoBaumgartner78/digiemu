import { ProductStatus } from "@prisma/client";

export const MARKETPLACE_VISIBLE: ProductStatus[] = [ProductStatus.ACTIVE];

export const SELLER_VISIBLE: ProductStatus[] = [
  ProductStatus.ACTIVE,
  ProductStatus.DRAFT,
  ProductStatus.BLOCKED,
];

export function isMarketplaceVisible(status: ProductStatus) {
  return MARKETPLACE_VISIBLE.includes(status);
}

export default { MARKETPLACE_VISIBLE, SELLER_VISIBLE, isMarketplaceVisible };
