// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitCheck, keyFromReq } from "@/lib/rateLimit";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";
import { hash } from "bcryptjs";

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
    try {
      const key = keyFromReq(_req, "auth_register");
      const rl = rateLimitCheck(key, 10, 60_000);
      if (!rl.allowed) {
        return NextResponse.json(
          {
            error: "TOO_MANY_REQUESTS",
            message: "Zu viele Anfragen. Bitte später erneut versuchen.",
          },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
        );
      }
    } catch (_e) {
      console.warn("rateLimit check failed", _e);
    }

    const bodyUnknown: unknown = await _req.json().catch(() => null);

    if (!isRecord(bodyUnknown)) {
      return NextResponse.json(
        { error: "INVALID_BODY", message: "Ungültiger Request." },
        { status: 400 }
      );
    }

    const email = getStringProp(bodyUnknown, "email");
    const password = getStringProp(bodyUnknown, "password");
    const name = getStringProp(bodyUnknown, "name");
    const role = getStringProp(bodyUnknown, "role") as RegisterBody["role"] | null;

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "MISSING_FIELDS",
          message: "E-Mail und Passwort sind erforderlich.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "WEAK_PASSWORD",
          message: "Das Passwort muss mindestens 8 Zeichen lang sein.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // For security: always register users as BUYER by default.
    // Role escalation to VENDOR happens after an admin approves the vendorProfile.
    const safeRole: "BUYER" | "VENDOR" = "BUYER";

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

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
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
  } catch (err: unknown) {
    console.error("[AUTH_REGISTER_ERROR]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: getErrorMessage(err) },
      { status: 500 }
    );
  }
}