import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { getErrorMessage } from "@/lib/guards";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

const isCiBuild = () =>
  process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// ✅ IMPORTANT: never throw during CI build
function requireFirebaseAdminEnv() {
  if (isCiBuild()) return;

  const missing = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ].filter((k) => !process.env[k]);

  if (missing.length) {
    throw new Error(`Missing Firebase Admin env vars (${missing.join(", ")})`);
  }
}

// ✅ Lazy import (prevents Next build from crashing on import-time)
async function getAdminBucket() {
  requireFirebaseAdminEnv(); // might throw in real runtime if missing

  const mod = await import("@/lib/firebaseAdmin");
  return mod.adminBucket;
}

export async function POST(_req: Request) {
  try {
    const sessionOrResp = await requireSessionApi();
    if (sessionOrResp instanceof NextResponse) return sessionOrResp;

    const session = sessionOrResp as Session;
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const form = await _req.formData();
    const file = form.get("file");

    const kindRaw = String(form.get("kind") ?? "avatar");
    const kind = kindRaw === "banner" ? "banner" : "avatar";

    if (!(file instanceof File)) return jsonError("No file provided");
    if (!ALLOWED.has(file.type)) return jsonError("Invalid file type. Use png/jpg/webp.");
    if (file.size > MAX_BYTES) return jsonError("File too large (max 2MB).", 413);

    const userId = session.user.id as string;

    const ext =
      file.type === "image/png" ? "png" :
      file.type === "image/webp" ? "webp" : "jpg";

    const folder = kind === "banner" ? "banners" : "avatars";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const objectPath = `${folder}/${userId}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();

    // ✅ bucket is loaded lazily here
    const adminBucket = await getAdminBucket();
    const storageFile = adminBucket.file(objectPath);

    await storageFile.save(buffer, {
      resumable: false,
      contentType: file.type,
      metadata: {
        metadata: { firebaseStorageDownloadTokens: token },
        cacheControl: "public, max-age=31536000",
      },
    });

    const bucketName = adminBucket.name;
    const encodedPath = encodeURIComponent(objectPath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

    return NextResponse.json({ ok: true, kind, path: objectPath, url: downloadUrl });
  } catch (err: unknown) {
    console.error("UPLOAD_API_ERROR", getErrorMessage(err));
    const msg = getErrorMessage(err) || "Upload failed";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
