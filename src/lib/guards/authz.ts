// src/lib/guards/authz.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Deine App-Rollen (identisch zu Prisma/NextAuth usage) */
export type AppRole = "BUYER" | "VENDOR" | "ADMIN";

/** Session-Typ mit garantiertem user.role */
export type AppSession = Session & {
  user: Session["user"] & {
    id?: string;
    role: AppRole;
  };
};

function isAppRole(v: unknown): v is AppRole {
  return v === "BUYER" || v === "VENDOR" || v === "ADMIN";
}

/** Holt Session und normalisiert role (Fallback BUYER) */
async function getAppSession(): Promise<AppSession | null> {
  const session = (await getServerSession(authOptions as any)) as Session | null;
  if (!session?.user) return null;

  const role = isAppRole((session.user as any).role) ? ((session.user as any).role as AppRole) : "BUYER";

  // session object "casten" + role normalisieren
  const normalized: AppSession = {
    ...(session as any),
    user: {
      ...(session.user as any),
      role,
    },
  };

  return normalized;
}

/* ===================== PAGES ===================== */

// Return a Session for server pages, or null if not present.
export async function requireSessionPage(): Promise<AppSession | null> {
  return await getAppSession();
}

export async function requireAdminPage(): Promise<AppSession | null> {
  const session = await getAppSession();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function requireVendorPage(): Promise<AppSession | null> {
  const session = await getAppSession();
  if (!session || session.user.role !== "VENDOR") return null;
  return session;
}

export async function requireRolePage(roles: readonly AppRole[]): Promise<AppSession | null> {
  const session = await getAppSession();
  if (!session) return null;
  if (!roles.includes(session.user.role)) return null;
  return session;
}

/* ===================== API ROUTES ===================== */

// For API routes: return Session when authorized, otherwise a NextResponse with 401/403.
export async function requireSessionApi(): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}

export async function requireAdminApi(): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

export async function requireVendorApi(): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "VENDOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

export async function requireRoleApi(roles: readonly AppRole[]): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roles.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

// Return optional session for API routes that accept anonymous users
export async function getOptionalSessionApi(): Promise<AppSession | null> {
  return await getAppSession();
}
