import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminBucket } from "@/lib/firebaseAdmin";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return jsonError("Unauthorized", 401);

    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "avatar"); // avatar | banner

    if (!(file instanceof File)) return jsonError("No file provided");
    if (!ALLOWED.has(file.type)) return jsonError("Invalid file type. Use png/jpg/webp.");
    if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, message: "File too large (max 2MB)." }, { status: 413 });

    const userId = session.user.id;
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const folder = kind === "banner" ? "banners" : "avatars";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const objectPath = `${folder}/${userId}/${filename}`;

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const token = randomUUID();

    const storageFile = getAdminBucket().file(objectPath);
    await storageFile.save(buffer, {
      resumable: false,
      contentType: file.type,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
        cacheControl: "public, max-age=31536000",
      },
    });

    const bucketName = getAdminBucket().name;
    const encodedPath = encodeURIComponent(objectPath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;

    return NextResponse.json({ ok: true, kind, path: objectPath, url: downloadUrl });
  } catch (err: any) {
    console.error("UPLOAD_API_ERROR", err);
    const msg = err?.message || String(err) || "Upload failed";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
