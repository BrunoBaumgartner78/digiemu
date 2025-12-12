// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Ungültiger Request-Body" },
        { status: 400 }
      );
    }

    const { email, password, name, role } = body as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { message: "E-Mail und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    // Rolle absichern – default BUYER
    const safeRole =
      role === "VENDOR" || role === "ADMIN" || role === "BUYER"
        ? role
        : "BUYER";

    // Existiert User schon?
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { message: "Es existiert bereits ein Konto mit dieser E-Mail." },
        { status: 409 }
      );
    }

    // Prisma-Model: User hat (id, email, name?, password?, role, isBlocked, ...)
    const user = await prisma.user.create({
      data: {
        email,
        password, // DEV: Klartext wie in deinen authOptions
        name: name ?? null,
        role: safeRole,
        // isBlocked bekommt automatisch @default(false)
      },
    });

    return NextResponse.json(
      {
        message: "Registrierung erfolgreich.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);

    if (err?.code === "P2002") {
      return NextResponse.json(
        { message: "Es existiert bereits ein Konto mit dieser E-Mail." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Serverfehler bei der Registrierung." },
      { status: 500 }
    );
  }
}
