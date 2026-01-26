import { Role, ProductStatus, VendorStatus } from "@/generated/prisma";

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
