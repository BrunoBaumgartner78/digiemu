import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const product = await prisma.product.create({
    data: {
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      category: String(data.category ?? ""),
      fileUrl: String(data.fileUrl ?? ""),
      thumbnail: data.thumbnail ? String(data.thumbnail) : null,
      priceCents: Number(data.priceCents),

      // ✅ WICHTIG: relation connect statt vendorId:
      vendor: { connect: { id: userId } },
    },
  });

  return NextResponse.json(product);
}
