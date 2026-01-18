import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

// Return a Session for server pages, or null if not present.
export async function requireSessionPage(): Promise<Session | null> {
  const session = (await getServerSession(auth as any)) as Session | null;
  return session ?? null;
}

// For API routes: return Session when authorized, otherwise a NextResponse with 401.
export async function requireAdminApi(): Promise<Session | NextResponse> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session as Session;
}

export async function requireVendorApi(): Promise<Session | NextResponse> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session || session.user?.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session as Session;
}

export async function requireSessionApi(): Promise<Session | NextResponse> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session as Session;
}

export async function requireRoleApi(roles: string[]): Promise<Session | NextResponse> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user || !roles.includes(session.user.role as string)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session as Session;
}

// Lightweight page guard for admin pages: return session or null.
export async function requireAdminPage(): Promise<Session | null> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session || session.user?.role !== "ADMIN") return null;
  return session as Session;
}

export async function requireVendorPage(): Promise<Session | null> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session || session.user?.role !== "VENDOR") return null;
  return session as Session;
}

export async function requireRolePage(roles: string[]): Promise<Session | null> {
  const session = (await getServerSession(auth as any)) as Session | null;
  if (!session) return null;
  if (!session.user || !roles.includes(session.user.role as string)) return null;
  return session as Session;
}

// Return optional session for API routes that accept anonymous users
export async function getOptionalSessionApi(): Promise<Session | null> {
  const session = (await getServerSession(auth as any)) as Session | null;
  return session ?? null;
}
