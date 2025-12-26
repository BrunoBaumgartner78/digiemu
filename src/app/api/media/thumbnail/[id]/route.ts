// src/app/api/media/thumbnail/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- Rate limit (best-effort, in-memory, per lambda instance) ----------
type Bucket = { count: number; resetAt: number };
const RL_WINDOW_MS = 60_000; // 1 min
const RL_MAX = 120;

const rlStore: Map<string, Bucket> =
  (globalThis as any).__thumb_rl_store ?? new Map();
(globalThis as any).__thumb_rl_store = rlStore;

function getIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const rip = req.headers.get("x-real-ip");
  return rip?.trim() || "unknown";
}

function rateLimit(req: NextRequest) {
  const ip = getIp(req);
  const key = `thumb:${ip}`;
  const now = Date.now();

  const b = rlStore.get(key);
  if (!b || now > b.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return { ok: true, remaining: RL_MAX - 1, resetAt: now + RL_WINDOW_MS };
  }

  if (b.count >= RL_MAX) return { ok: false, remaining: 0, resetAt: b.resetAt };

  b.count += 1;
  rlStore.set(key, b);
  return { ok: true, remaining: Math.max(0, RL_MAX - b.count), resetAt: b.resetAt };
}

// ---------- Token verify ----------
function verifyToken(productId: string, variant: string, expRaw: string | null, sig: string | null) {
  const secret = (process.env.THUMB_TOKEN_SECRET ?? "").trim();
  if (!secret) return true; // dev-friendly

  if (!expRaw || !sig) return false;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return false;
  if (Date.now() > exp) return false;

  const payload = `${productId}.${variant}.${exp}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

// ---------- Image processing (sharp optional, variant-aware) ----------
async function processIfPossible(
  input: Buffer,
  productId: string,
  variant: "blur" | "full"
): Promise<{ buf: Buffer; contentType: string; transformed: boolean }> {
  let sharp: any = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return { buf: input, contentType: "image/jpeg", transformed: false };
  }
  const stamp = `DIGIEMU • ${productId.slice(0, 8)}`;
  const svg = `
            <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="p" patternUnits="userSpaceOnUse" width="420" height="260" patternTransform="rotate(-25)">
                  <text x="0" y="80" font-size="46" font-family="Arial" fill="rgba(255,255,255,0.18)">${stamp}</text>
                </pattern>
              </defs>
              <rect width="1200" height="1200" fill="url(#p)"/>
            </svg>`;

  const blurSigma = variant === "blur" ? 24 : 0;

  let img = sharp(input)
    .rotate()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true });

  if (variant === "blur") {
    const out = await img
      .blur(blurSigma)
      .composite([{ input: Buffer.from(svg), blend: "over", gravity: "center" }])
      .jpeg({ quality: 55, mozjpeg: true })
      .toBuffer();
    return { buf: out, contentType: "image/jpeg", transformed: true };
  }

  // full (sharp, no blur)
  const out = await img
    .composite([{ input: Buffer.from(svg), blend: "over", gravity: "center" }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
  return { buf: out, contentType: "image/jpeg", transformed: true };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  // 1) Rate limit
  const rl = rateLimit(req);
  if (!rl.ok) {
    const res = NextResponse.json(
      { ok: false, error: "rate_limited", resetAt: rl.resetAt },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(Math.ceil((rl.resetAt - Date.now()) / 1000)));
    return res;
  }

  // ✅ Next 16: params is Promise
  const { id } = await ctx.params;
  const productId = String(id ?? "").trim();
  if (!productId) return new NextResponse("Not Found", { status: 404 });

  // 2) Session + product visibility
  const session = await getServerSession(auth);
  const userId = ((session?.user as any)?.id as string | undefined) ?? null;
  const role = ((session?.user as any)?.role as string | undefined) ?? null;
  const isAdmin = role === "ADMIN";

  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      thumbnail: true,
      isActive: true,
      status: true,
      vendorId: true,
      vendor: { select: { isBlocked: true } },
    },
  });

  if (!p) return new NextResponse("Not Found", { status: 404 });

  const isOwner = !!userId && userId === p.vendorId;
  const canPreview = isAdmin || isOwner;
  const isPublicVisible = p.isActive === true && p.status === "ACTIVE" && !p.vendor?.isBlocked;

  if (!isPublicVisible && !canPreview) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // read variant early so token check can verify it
  const variantParamEarly = req.nextUrl.searchParams.get("variant");
  const variantEarly: "blur" | "full" = variantParamEarly === "blur" ? "blur" : "full";

  // 3) Token check (only for public + not owner/admin)
  if (isPublicVisible && !canPreview) {
    const exp = req.nextUrl.searchParams.get("exp");
    const sig = req.nextUrl.searchParams.get("sig");
    if (!verifyToken(productId, variantEarly, exp, sig)) return new NextResponse("Not Found", { status: 404 });
  }

  // 4) Fallback if no thumbnail
  if (!p.thumbnail || !String(p.thumbnail).trim()) {
    const url = new URL("/fallback-thumbnail.svg", req.url);
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Cross-Origin-Resource-Policy", "same-site");
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return res;
  }

  // 5) Fetch upstream server-side
  let upstream: Response;
  try {
    upstream = await fetch(p.thumbnail, { cache: "no-store" });
  } catch {
    return new NextResponse("Upstream error", { status: 502 });
  }

  if (!upstream.ok) {
    const url = new URL("/fallback-thumbnail.svg", req.url);
    return NextResponse.redirect(url, 307);
  }

  const inputBuf = Buffer.from(await upstream.arrayBuffer());

  // 6) Process (variant-aware: blur=card preview, full=sharp)
  const variantParam = req.nextUrl.searchParams.get("variant");
  const variant: "blur" | "full" = variantParam === "blur" ? "blur" : "full";

  let outBuf: Buffer | Uint8Array = inputBuf;
  let outType = upstream.headers.get("content-type") || "image/jpeg";
  let transformed = false;
  try {
    const processed = await processIfPossible(inputBuf, productId, variant);
    outBuf = processed.buf;
    outType = processed.contentType;
    transformed = processed.transformed === true;
  } catch {
    outBuf = inputBuf;
    outType = upstream.headers.get("content-type") || "image/jpeg";
    transformed = false;
  }

  const res = new NextResponse(outBuf as any, {
    status: 200,
    headers: {
      "Content-Type": outType,
      "Cross-Origin-Resource-Policy": "same-site",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Disposition": 'inline; filename="thumb.jpg"',
    },
  });

  res.headers.set("Cache-Control", isPublicVisible ? "public, max-age=3600, s-maxage=3600" : "no-store");
  res.headers.set("X-RateLimit-Limit", String(RL_MAX));
  res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
  res.headers.set("X-RateLimit-Reset", String(rl.resetAt));
  // Debug headers
  res.headers.set("X-Thumb-Variant", variant);
  res.headers.set("X-Thumb-Transformed", transformed ? "1" : "0");

  return res;
}
