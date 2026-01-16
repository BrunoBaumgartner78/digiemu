// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitCheck, keyFromReq } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
  role?: "BUYER" | "VENDOR" | "ADMIN";
};

export async function POST(_req: Request) {
  try {
    // Rate limit: registration attempts per IP (~10 per 60s)
    try {
      const key = keyFromReq(req, "auth_register");
      const rl = rateLimitCheck(key, 10, 60_000);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "TOO_MANY_REQUESTS", message: "Zu viele Anfragen. Bitte später erneut versuchen." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
        );
      }
    } catch (_e) {
      // don't block on rateLimit errors
      console.warn("rateLimit check failed", e);
    }
    const body: RegisterBody | null = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "INVALID_BODY", message: "Ungültiger Request." },
        { status: 400 }
      );
    }

    const { email, password, name, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "MISSING_FIELDS",
          message: "E-Mail und Passwort sind erforderlich.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rolle absichern (ADMIN darf nicht via Public-Register)
    const safeRole: "BUYER" | "VENDOR" =
      role === "VENDOR" ? "VENDOR" : "BUYER";

    // Existiert User bereits?
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "EMAIL_EXISTS",
          message: "Diese E-Mail-Adresse ist bereits registriert.",
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password, // DEV/MVP: Klartext (wie bei dir vorgesehen)
        name: name?.trim() || null,
        role: safeRole,
      },
      select: { id: true },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Registrierung erfolgreich.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[AUTH_REGISTER_ERROR]", err);

    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Serverfehler bei der Registrierung.",
      },
      { status: 500 }
    );
  }
}
