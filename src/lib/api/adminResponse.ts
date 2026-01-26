import { NextResponse } from "next/server";

export function ok(data: any = { ok: true }, init?: ResponseInit) {
  return NextResponse.json(data, {
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

export function fail(message: string) {
  return bad(message, 500);
}
