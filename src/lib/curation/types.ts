import { Prisma } from "@prisma/client";
const { Role, ProductStatus, VendorStatus } = Prisma;

export type ViewerCtx = {
  role: Role;
  userId?: string | null;
};

export function isAdmin(ctx: ViewerCtx) {
  return ctx.role === "ADMIN";
}

export function isVendor(ctx: ViewerCtx) {
  return ctx.role === "VENDOR" && !!ctx.userId;
}
