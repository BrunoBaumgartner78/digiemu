import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getE2EAdminFromRequest } from "@/lib/e2e/e2eAdmin";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";

export async function POST(req: Request) {
  const session = await getServerSession(auth);
  const user = (session?.user as any) || (await getE2EAdminFromRequest(req));
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const tenantId = String(form.get("tenantId") || "");
  const domainId = String(form.get("domainId") || "");

  if (!tenantId || !domainId) {
    return NextResponse.json({ ok: false, error: "Missing tenantId/domainId" }, { status: 400 });
  }

  // Load tenant to evaluate capabilities
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { key: true } });
  if (!tenant) {
    return NextResponse.json({ ok: false, error: "tenant not found" }, { status: 404 });
  }

  const { capabilities } = await resolveTenantWithCapabilities(tenant.key);
  if (!capabilities.whiteLabelStore || !capabilities.customDomain) {
    return NextResponse.json({ ok: false, error: "CUSTOM_DOMAIN_NOT_ALLOWED" }, { status: 403 });
  }

  await prisma.tenantDomain.updateMany({ where: { tenantId }, data: { isPrimary: false } });
  await prisma.tenantDomain.update({ where: { id: domainId }, data: { isPrimary: true } });

  const referer = req.headers.get("referer");
  return NextResponse.redirect(
    referer ? new URL(referer) : new URL(`/admin/tenants/${tenantId}`, req.url),
    303
  );
}
