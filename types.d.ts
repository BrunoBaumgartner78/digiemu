import type { Prisma } from "@prisma/client";

/* -------------------------------------------
   DigiEmu Global Backend Types
-------------------------------------------- */

// User
export type UserBasic = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true; role: true };
}>;

// Product (with vendor)
export type ProductWithVendor = Prisma.ProductGetPayload<{
  include: { vendor: true };
}>;

// Order (with product)
export type OrderWithProduct = Prisma.OrderGetPayload<{
  include: { product: true };
}>;

// Sales (downloads included)
export type VendorSale = Prisma.OrderGetPayload<{
  include: {
    product: true;
    downloadLink: true;
    buyer: { select: { id: true; name: true; email: true } };
  };
}>;

// Payouts (with vendor user)
export type VendorPayout = Prisma.PayoutGetPayload<{
  include: { vendor: true };
}>;

// Admin payouts overview
export type AdminPayout = Prisma.PayoutGetPayload<{
  include: { vendor: true };
}>;

// Vendor Profile
export type VendorProfileFull = Prisma.VendorProfileGetPayload<{
  include: {
    user: true;
    products: true;
  };
}>;
