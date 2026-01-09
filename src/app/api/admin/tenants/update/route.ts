// /src/app/api/admin/tenants/update/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getE2EAdminFromRequest } from "@/lib/e2e/e2eAdmin";
import { parseTenantPlan } from "@/lib/tenant/tenantGuards";
import { normalizeTenantMode } from "@/lib/tenantMode";
import { canUseBranding, getTenantPlanConfig, normalizeTenantPlan } from "@/lib/tenantPlans";
import { resolveTenantWithCapabilities } from "@/lib/tenants/tenant-resolver";

// --- helpers ---
function toStr(v: FormDataEntryValue | null | undefined) {
  return typeof v === "string" ? v : "";
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function safeParseJson(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || (await getE2EAdminFromRequest(req));

  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") || "";
  let tenantId = "";
  let name: string | undefined;
  let status: string | undefined;
  let plan: string | undefined;
  let mode: string | undefined;
  let logoUrl: string | undefined;
  let themeJsonRaw: string | undefined;
  let shellRaw: string | undefined;
  let homePathRaw: string | undefined;
  let showAuthLinksRaw: string | undefined;
  let showRegisterRaw: string | undefined;
  let poweredByRaw: string | undefined;
  let hideInfoPagesRaw: string | undefined;
  let showLogoRaw: string | undefined;

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));

    // ✅ Enforce allowed tenant modes (internal enum)
    const ALLOWED_TENANT_MODES = new Set(["WHITE_LABEL", "MARKETPLACE"]);
    if (body?.mode !== undefined && !ALLOWED_TENANT_MODES.has(String(body.mode).toUpperCase())) {
      return NextResponse.json({ ok: false, error: "Invalid tenant mode" }, { status: 400 });
    }
    tenantId = String(body.tenantId || "");
    name = isNonEmptyString(body.name) ? body.name.trim() : undefined;
    status = isNonEmptyString(body.status) ? body.status.trim().toUpperCase() : undefined;
    plan = isNonEmptyString(body.plan) ? body.plan.trim().toUpperCase() : undefined;
    // accept mode from JSON body (optional)
    mode = isNonEmptyString(body.mode) ? body.mode.trim().toUpperCase() : undefined;
    logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : undefined;
    themeJsonRaw = typeof body.themeJson === "string" ? body.themeJson : undefined;
    // shell can be either a string or an object with detailed flags
    if (typeof body.shell === "string") {
      shellRaw = body.shell.trim().toUpperCase();
    } else if (body.shell && typeof body.shell === "object") {
      shellRaw = typeof body.shell.shellVariant === "string" ? String(body.shell.shellVariant).trim().toUpperCase() : undefined;
      showAuthLinksRaw = typeof body.shell.showAuthLinks === "boolean" ? String(body.shell.showAuthLinks) : undefined;
      showRegisterRaw = typeof body.shell.showRegister === "boolean" ? String(body.shell.showRegister) : undefined;
      poweredByRaw = typeof body.shell.poweredBy === "boolean" ? String(body.shell.poweredBy) : undefined;
      hideInfoPagesRaw = typeof body.shell.hideInfoPages === "boolean" ? String(body.shell.hideInfoPages) : undefined;
      showLogoRaw = typeof body.shell.showLogo === "boolean" ? String(body.shell.showLogo) : undefined;
    }
    homePathRaw = typeof body.homePath === "string" ? body.homePath.trim() : undefined;

    // ✅ Guard: only allow known values (blocks legacy SINGLE_VENDOR etc.)
    if (body?.mode !== undefined) {
      try {
        mode = normalizeTenantMode(body.mode);
      } catch (e) {
        return NextResponse.json({ ok: false, error: "Invalid tenant mode" }, { status: 400 });
      }
    }

    if (body?.plan !== undefined) {
      const parsedPlan = parseTenantPlan(body.plan);
      if (!parsedPlan) return NextResponse.json({ ok: false, error: "Invalid tenant plan" }, { status: 400 });
      plan = parsedPlan;
    }
  } else {
    const fd = await req.formData();
    tenantId = toStr(fd.get("tenantId"));
    const n = toStr(fd.get("name"));
    const s = toStr(fd.get("status"));
    const p = toStr(fd.get("plan"));
    const m = toStr(fd.get("mode"));
    const l = toStr(fd.get("logoUrl"));
    const t = toStr(fd.get("themeJson"));
    const shellF = toStr(fd.get("shell"));
    const h = toStr(fd.get("homePath"));
    const showAuth = toStr(fd.get("showAuthLinks"));
    const showReg = toStr(fd.get("showRegister"));
    const powered = toStr(fd.get("poweredBy"));
    const hideInfo = toStr(fd.get("hideInfoPages"));
    const showLg = toStr(fd.get("showLogo"));

    name = n.trim() ? n.trim() : undefined;
    status = s.trim() ? s.trim().toUpperCase() : undefined;
    plan = p.trim() ? p.trim().toUpperCase() : undefined;
    // form-provided mode (optional)
    mode = m.trim() ? m.trim().toUpperCase() : undefined;
    logoUrl = l.trim() ? l.trim() : undefined;
    themeJsonRaw = t.trim() ? t.trim() : undefined;
    shellRaw = shellF.trim() ? shellF.trim().toUpperCase() : undefined;
    homePathRaw = h.trim() ? h.trim() : undefined;
    showAuthLinksRaw = showAuth.trim() ? showAuth.trim() : undefined;
    showRegisterRaw = showReg.trim() ? showReg.trim() : undefined;
    poweredByRaw = powered.trim() ? powered.trim() : undefined;
    hideInfoPagesRaw = hideInfo.trim() ? hideInfo.trim() : undefined;
    showLogoRaw = showLg.trim() ? showLg.trim() : undefined;
  }

  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId missing" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { domains: true },
  });

  if (!tenant) {
    return NextResponse.json({ ok: false, error: "tenant not found" }, { status: 404 });
  }

  // ✅ Capabilities-based hard guard (single source of truth)
  const { capabilities } = await resolveTenantWithCapabilities(tenant.key);

  // validate form-provided values (form branch)
  if (!ct.includes("application/json")) {
    if (plan !== undefined) {
      const parsedPlan = parseTenantPlan(plan);
      if (!parsedPlan) return NextResponse.json({ ok: false, error: "Invalid tenant plan" }, { status: 400 });
      plan = parsedPlan;
    }
    if (mode !== undefined) {
      try {
        mode = normalizeTenantMode(mode);
      } catch (e) {
        return NextResponse.json({ ok: false, error: "Invalid tenant mode" }, { status: 400 });
      }
    }
  }

  // normalize plan if provided, else keep existing
  const nextPlan = plan ? normalizeTenantPlan(plan) : normalizeTenantPlan((tenant as any).plan);
  const nextPlanCfg = getTenantPlanConfig(nextPlan);

  // enforce plan downgrade: domain count must fit new plan
  const domainCount = tenant.domains.length;
  if (domainCount > nextPlanCfg.limits.maxDomains) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot set plan ${nextPlan}: tenant has ${domainCount} domains (max ${nextPlanCfg.limits.maxDomains}). Remove domains first.`,
      },
      { status: 400 }
    );
  }

  // Branding enforcement (capabilities): forbid setting logo/theme if not allowed
  // Note: shell toggles (header/footer behavior) are allowed even when branding is disabled.
  if (!capabilities.branding && (logoUrl !== undefined || themeJsonRaw !== undefined)) {
    return NextResponse.json({ ok: false, error: "BRANDING_NOT_ALLOWED" }, { status: 403 });
  }

  // Build update payload
  const data: any = {};

  if (name !== undefined) data.name = name;
  if (status !== undefined) data.status = status; // expected "ACTIVE" | "BLOCKED" in your model
  if (plan !== undefined) data.plan = nextPlan;
  if (mode !== undefined) data.mode = mode as any;

  if (logoUrl !== undefined) data.logoUrl = logoUrl;

  if (themeJsonRaw !== undefined) {
    // allow either json string or plain empty string to clear
    if (themeJsonRaw.trim() === "") {
      data.themeJson = null;
    } else {
      const parsed = safeParseJson(themeJsonRaw);
      if (!parsed) {
        return NextResponse.json({ ok: false, error: "themeJson must be valid JSON" }, { status: 400 });
      }
      data.themeJson = parsed;
    }
  }

  // Accept shell/homePath as standalone fields and merge into themeJson
  if (
    shellRaw !== undefined ||
    homePathRaw !== undefined ||
    showAuthLinksRaw !== undefined ||
    showRegisterRaw !== undefined ||
    poweredByRaw !== undefined ||
    hideInfoPagesRaw !== undefined ||
    showLogoRaw !== undefined
  ) {
    // Validate shell value when provided
    if (shellRaw !== undefined) {
      const allowed = new Set(["FULL", "MINIMAL"]);
      if (!allowed.has(shellRaw)) {
        return NextResponse.json({ ok: false, error: "Invalid shell value" }, { status: 400 });
      }
    }

    // start from existing themeJson (tenant.themeJson may be null)
    const baseTheme = (data.themeJson !== undefined ? data.themeJson : (tenant.themeJson ?? {})) as any;
    const nextTheme = { ...(baseTheme || {}) };
    // Ensure shell object exists
    nextTheme.shell = nextTheme.shell || {};
    if (shellRaw !== undefined) nextTheme.shell.shellVariant = shellRaw === "MINIMAL" ? "MINIMAL" : "DEFAULT";
    if (homePathRaw !== undefined) nextTheme.shell.homePath = homePathRaw === "" ? null : homePathRaw;

    // boolean toggles (form values come as strings)
    const toBool = (v: string | undefined) => {
      if (v === undefined) return undefined;
      const s = String(v).toLowerCase();
      return s === "1" || s === "true" || s === "on";
    };

    const sb = toBool(showAuthLinksRaw);
    const sr = toBool(showRegisterRaw);
    const pb = toBool(poweredByRaw);
    const hi = toBool(hideInfoPagesRaw);
    const sl = toBool(showLogoRaw);

    if (sb !== undefined) nextTheme.shell.showAuthLinks = sb;
    if (sr !== undefined) nextTheme.shell.showRegister = sr;
    if (pb !== undefined) nextTheme.shell.poweredBy = pb;
    if (hi !== undefined) nextTheme.shell.hideInfoPages = hi;
    if (sl !== undefined) nextTheme.shell.showLogo = sl;
    data.themeJson = nextTheme;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      // ensure mode is persisted when provided (explicit spread)
      ...(mode !== undefined ? { mode: mode as any } : {}),
      ...data,
    },
  });

  // After successful update, redirect to the tenant detail page (POST-Redirect-GET)
  return NextResponse.redirect(new URL(`/admin/tenants/${tenantId}`, req.url), 303);
}
