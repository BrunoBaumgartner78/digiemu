import { NextResponse } from "next/server";

export function ok<T = unknown>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, {
    status: 200,
    headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) },
    ...init,
  });
}

export function bad(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export function unauth() {
  return bad("Unauthorized", 401);
}

export function fail(message: unknown, status = 500) {
  return bad(String(message ?? "Error"), status);
}
