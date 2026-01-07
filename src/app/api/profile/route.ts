import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";
import { currentTenant } from "@/lib/tenant-context";
import { profileSchema } from "@/lib/profile-validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { tenantKey: rawTenantKey } = await currentTenant();
  const tenantKey = rawTenantKey ?? "DEFAULT";

  const profile = await prisma.vendorProfile.findUnique({
    where: { tenantKey_userId: { tenantKey, userId: session.user.id } },
  });

  return NextResponse.json(profile ?? {});
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await req.json();
  const parsed = profileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const { tenantKey: rawTenantKey2 } = await currentTenant();
  const tenantKey2 = rawTenantKey2 ?? "DEFAULT";

  const profile = await prisma.vendorProfile.upsert({
    where: { tenantKey_userId: { tenantKey: tenantKey2, userId: session.user.id } },
    create: {
      tenantKey: tenantKey2,
      userId: session.user.id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json(profile);
}
