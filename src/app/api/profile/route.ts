import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/profile-validation";

export async function GET() {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile ?? {});
}

export async function PUT(_req: Request) {
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await _req.json();
  const parsed = profileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const profile = await prisma.vendorProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json(profile);
}
