import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }
  const data = await req.json();
  try {
    // TODO: Validate data more strictly
    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        category: data.category,
        priceCents: data.priceCents, // TODO: Confirm price mapping
        fileUrl: data.fileUrl,
        thumbnail: data.thumbnail,
        status: data.status,
        vendorId: data.vendorId,
      },
    });
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Fehler beim Erstellen." }, { status: 500 });
  }
}
