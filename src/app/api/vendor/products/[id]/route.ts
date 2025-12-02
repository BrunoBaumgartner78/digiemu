import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../../auth/[...nextauth]/route";

// Hilfsfunktion: User aus Session holen
async function getDbUserFromSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}


// PATCH = Produkt updaten (z.B. Titel, Preis, isActive)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getDbUserFromSession();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { id: productId } = await context.params;
  const body = await req.json(); // z.B. { title, description, priceCents, isActive }

  // Produkt gehört diesem User?
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      OR: [
        { vendorId: user.id },
        // Admin darf auch bearbeiten
        { vendorId: { not: user.id }, AND: user.role === "ADMIN" ? {} : { id: productId } },
      ],
    },
  });

  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Produkt nicht gefunden oder keine Berechtigung." },
      { status: 404 }
    );
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.priceCents === "number") data.priceCents = body.priceCents;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.thumbnail === "string") data.thumbnail = body.thumbnail;

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
  });

  return NextResponse.json({ ok: true, product: updated });
}

// DELETE = Produkt löschen
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getDbUserFromSession();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { id: productId } = await context.params;

  // nur Owner oder Admin
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      OR: [
        { vendorId: user.id },
        user.role === "ADMIN" ? {} : { id: productId },
      ],
    },
  });

  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Produkt nicht gefunden oder keine Berechtigung." },
      { status: 404 }
    );
  }

  await prisma.product.delete({
    where: { id: productId },
  });

  return NextResponse.json({ ok: true });
}
