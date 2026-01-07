// /src/app/api/admin/tenants/domain/add/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getE2EAdminFromRequest } from "@/lib/e2e/e2eAdmin";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";
import { maxDomainsFor } from "@/lib/tenantPlans";

// --- helpers ---
function toStr(v: FormDataEntryValue | null | undefined) {
  return typeof v === "string" ? v : "";
}

function normalizeDomain(input: string) {
  let d = (input || "").trim().toLowerCase();
  if (!d) return "";

  // strip protocol
  d = d.replace(/^https?:\/\//, "");

  // strip path/query/hash
  d = d.split("/")[0] ?? d;

  // strip port
  d = d.replace(/:\d+$/, "");

  // strip leading www.
  d = d.replace(/^www\./, "");

  return d.trim();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || (await getE2EAdminFromRequest(req));

  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") || "";
  let tenantId = "";
  let domain = "";
  let makePrimary = false;

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    tenantId = String(body.tenantId || "");
    domain = String(body.domain || "");
    makePrimary = Boolean(body.makePrimary);
  } else {
    const fd = await req.formData();
    tenantId = toStr(fd.get("tenantId"));
    domain = toStr(fd.get("domain"));
    // form sends checkbox as value "1" when checked
    makePrimary = toStr(fd.get("makePrimary")) === "1";
  }

  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId missing" }, { status: 400 });
  }

  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return NextResponse.json({ ok: false, error: "domain missing" }, { status: 400 });
  }

  // Load tenant with domains + plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { domains: true },
  });

  if (!tenant) {
    return NextResponse.json({ ok: false, error: "tenant not found" }, { status: 404 });
  }

  // ✅ Hard guard: Domains only for WL tenants with customDomain capability
  const { capabilities } = await resolveTenantWithCapabilities(tenant.key);
  if (!capabilities.whiteLabelStore || !capabilities.customDomain) {
    return NextResponse.json({ ok: false, error: "CUSTOM_DOMAIN_NOT_ALLOWED" }, { status: 403 });
  }

  // Plan limit check
  const maxDomains = maxDomainsFor((tenant as any).plan);
  const currentCount = tenant.domains.length;

  if (currentCount >= maxDomains) {
    return NextResponse.json(
      {
        ok: false,
        error: `Domain limit reached for plan ${(tenant as any).plan} (max ${maxDomains}).`,
      },
      { status: 400 }
    );
  }

  // Global uniqueness check
  const existing = await prisma.tenantDomain.findUnique({
    where: { domain: normalized },
    select: { id: true, tenantId: true },
  });

  if (existing) {
    return NextResponse.json(
      { ok: false, error: "domain already exists", domain: normalized },
      { status: 400 }
    );
  }

  // If first domain -> force primary
  const shouldBePrimary = currentCount === 0 ? true : makePrimary;

  await prisma.$transaction(async (tx) => {
    // If setting primary, unset others
    if (shouldBePrimary) {
      await tx.tenantDomain.updateMany({
        where: { tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    await tx.tenantDomain.create({
      data: {
        tenantId,
        domain: normalized,
        isPrimary: shouldBePrimary,
      } as any,
    });
  });

  const referer = req.headers.get("referer");
  return NextResponse.redirect(
    referer ? new URL(referer) : new URL(`/admin/tenants/${tenantId}`, req.url),
    303
  );
}
