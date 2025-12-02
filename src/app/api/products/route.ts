import { productSchema } from "../../../lib/product-validation";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession();

  if (!session || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const data = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...data,
      priceCents: Number(data.priceCents),
      vendorId: session.user.id,
    },
  });

  return NextResponse.json(product);
}
