import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { adminBucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
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
