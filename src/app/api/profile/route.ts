import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions"; 
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/profile-validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
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
