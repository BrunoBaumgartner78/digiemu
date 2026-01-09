import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTenantPlan } from "@/lib/tenant/tenantGuards";
import { normalizeTenantMode } from "@/lib/tenantMode";

function slugifyKey(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDomain(input: string) {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return "";
  const noProto = raw.replace(/^https?:\/\//, "");
  const noPath = noProto.split("/")[0] ?? noProto;
  const noPort = noPath.split(":")[0] ?? noPath;
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

export async function POST(req: Request) {
  const session = await getServerSession(auth);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // If client sends JSON, validate mode early
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    const ALLOWED_TENANT_MODES = new Set(["WHITE_LABEL", "MARKETPLACE"]);
    if (body?.mode !== undefined && !ALLOWED_TENANT_MODES.has(String(body.mode).toUpperCase())) {
      return NextResponse.json({ ok: false, error: "Invalid tenant mode" }, { status: 400 });
    }
  }

  const form = await req.formData();
  const key = slugifyKey(String(form.get("key") || ""));
  const name = String(form.get("name") || "").trim();
  const planRaw = String(form.get("plan") || "FREE");
  const plan = parseTenantPlan(planRaw);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Invalid tenant plan" }, { status: 400 });
  }
  const primaryDomainRaw = String(form.get("primaryDomain") || "");
  const primaryDomain = normalizeDomain(primaryDomainRaw);

  const modeRaw = String(form.get("mode") || "");
  const ALLOWED_TENANT_MODES = new Set(["WHITE_LABEL", "MARKETPLACE"]);
  if (modeRaw && !ALLOWED_TENANT_MODES.has(String(modeRaw).toUpperCase())) {
    return NextResponse.json({ ok: false, error: "Invalid tenant mode" }, { status: 400 });
  }
  let mode: string;
  try {
    mode = normalizeTenantMode(modeRaw || "WHITE_LABEL");
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Invalid tenant mode" }, { status: 400 });
  }

  if (!key || key.length < 3) {
    return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
  }
  if (!["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
    return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.create({
      data: {
        key,
        name,
        plan: plan as any,
        mode: mode as any,
        status: "ACTIVE",
      },
    });

    if (primaryDomain) {
      await prisma.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          domain: primaryDomain,
          isPrimary: true,
        },
      });
    }

    return NextResponse.redirect(new URL(`/admin/tenants/${tenant.id}`, req.url));
  } catch (e: any) {
    // unique key/domain collisions land here
    return NextResponse.json(
      { ok: false, error: e?.message || "Create failed" },
      { status: 400 }
    );
  }
}
