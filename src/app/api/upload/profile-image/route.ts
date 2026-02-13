import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { adminBucket } from "@/lib/firebaseAdmin";

const isCiBuild = () =>
  process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

function requireFirebaseAdminEnv() {
  if (isCiBuild() && process.env.NODE_ENV !== "production") return;
  const missing = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ].filter((k) => !process.env[k]);

  if (missing.length) {
    throw new Error(`Missing Firebase Admin env vars (${missing.join(", ")})`);
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const userId = session?.user?.id as string | undefined;

  // Ensure Firebase Admin env is present at runtime; avoid throwing during CI build
  requireFirebaseAdminEnv();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await _req.formData();
  const file = formData.get("file") as File | null;
  const kind = formData.get("kind") as string | null;

  if (!file || !kind) {
    return NextResponse.json({ error: "missing file/kind" }, { status: 400 });
  }

  if (kind !== "avatar" && kind !== "banner") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid file type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeExt = (file.name.split(".").pop() || "png").replace(/[^\w]/g, "");
  const path = `vendor-profiles/${userId}/${kind}/${Date.now()}.${safeExt}`;

  const object = adminBucket.file(path);

  await object.save(buffer, {
    contentType: file.type,
    resumable: false,
    public: true, // ✅ damit URL direkt funktioniert
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  const publicUrl = `https://storage.googleapis.com/${adminBucket.name}/${path}`;

  return NextResponse.json({ url: publicUrl });
}
