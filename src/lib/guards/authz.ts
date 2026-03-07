// src/lib/guards/authz.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Deine App-Rollen (identisch zu Prisma/NextAuth usage) */
export type AppRole = "BUYER" | "VENDOR" | "ADMIN";

/** Session-Typ mit garantiertem user.role */
export type AppSession = Session & {
  user: Session["user"] & {
    id: string;
    role: AppRole;
    isBlocked: boolean;
  };
};

function isAppRole(v: unknown): v is AppRole {
  return v === "BUYER" || v === "VENDOR" || v === "ADMIN";
}

/** Holt Session und normalisiert role (Fallback BUYER) */
async function getAppSession(): Promise<AppSession | null> {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) return null;

  const userId = (session.user as { id?: unknown }).id;
  if (typeof userId !== "string" || userId.trim() === "") return null;

  const roleRaw = (session.user as { role?: unknown }).role;
  const blockedRaw = (session.user as { isBlocked?: unknown }).isBlocked;

  let role = isAppRole(roleRaw) ? roleRaw : null;
  let isBlocked = typeof blockedRaw === "boolean" ? blockedRaw : null;

  if (role === null || isBlocked === null) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, isBlocked: true },
      });

      if (!dbUser) return null;

      role = isAppRole(dbUser.role) ? dbUser.role : "BUYER";
      isBlocked = dbUser.isBlocked === true;
    } catch (error) {
      console.warn("getAppSession fallback lookup failed", error);
      role = role ?? "BUYER";
      isBlocked = isBlocked ?? false;
    }
  }

  // session object "casten" + role normalisieren
  const normalized: AppSession = {
    ...(session as unknown as Session),
    user: {
      ...(session.user as unknown as Session["user"]),
      id: userId,
      role,
      isBlocked,
    },
  };

  return normalized;
}

function isBlockedSession(session: AppSession | null): boolean {
  return session !== null && session.user.isBlocked === true;
}

function blockedApiResponse(): NextResponse {
  return NextResponse.json({ error: "Account blocked" }, { status: 403 });
}

/* ===================== PAGES ===================== */

// Return a Session for server pages, or null if not present.
export async function requireSessionPage(): Promise<AppSession | null> {
  const session = await getAppSession();
  if (isBlockedSession(session)) return null;
  return session;
}

export async function requireAdminPage(): Promise<AppSession | null> {
  const session = await getAppSession();
  if (isBlockedSession(session)) return null;
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function requireVendorPage(): Promise<AppSession | null> {
  const session = await getAppSession();
  if (isBlockedSession(session)) return null;
  if (!session || session.user.role !== "VENDOR") return null;
  return session;
}

export async function requireRolePage(roles: readonly AppRole[]): Promise<AppSession | null> {
  const session = await getAppSession();
  if (isBlockedSession(session)) return null;
  if (!session) return null;
  if (!roles.includes(session.user.role)) return null;
  return session;
}

/* ===================== API ROUTES ===================== */

// For API routes: return Session when authorized, otherwise a NextResponse with 401/403.
export async function requireSessionApi(): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.isBlocked) return blockedApiResponse();
  return session;
}

export async function requireAdminApi(): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.isBlocked) return blockedApiResponse();
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

export async function requireVendorApi(): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.isBlocked) return blockedApiResponse();
  if (session.user.role !== "VENDOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

export async function requireRoleApi(roles: readonly AppRole[]): Promise<AppSession | NextResponse> {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.isBlocked) return blockedApiResponse();
  if (!roles.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

// Return optional session for API routes that accept anonymous users
export async function getOptionalSessionApi(): Promise<AppSession | null> {
  return await getAppSession();
}
