import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  // ✅ vendorProfile holen (weil Product offenbar nicht vendorId hat)
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!vendorProfile) {
    return NextResponse.json({ error: "Vendor profile missing" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      fileUrl: data.fileUrl,
      thumbnail: data.thumbnail ?? null,
      priceCents: Number(data.priceCents),

      // ✅ so statt vendorId:
      vendorProfileId: vendorProfile.id,
      // (Alternative wäre: vendorProfile: { connect: { id: vendorProfile.id } })
    },
  });

  return NextResponse.json(product);
}
