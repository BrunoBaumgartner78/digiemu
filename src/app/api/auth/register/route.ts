import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email und Passwort erforderlich" }, { status: 400 });
  }
  // Existiert User?
  const userRes = await prisma.$queryRawUnsafe(
    `SELECT * FROM "User" WHERE email = $1`,
    email
  );
  const user = Array.isArray(userRes) ? userRes[0] : userRes;
  if (user) {
    return NextResponse.json({ ok: false, error: "User existiert bereits" }, { status: 400 });
  }
  // Passwort hashen
  const hashed = await bcrypt.hash(password, 10);
  // User anlegen
  const createRes = await prisma.$queryRawUnsafe(
    `INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now()) RETURNING id, email, role`,
    email,
    hashed,
    name ?? null,
    "BUYER"
  );
  const newUser = Array.isArray(createRes) ? createRes[0] : createRes;
  return NextResponse.json({ ok: true, user: newUser });
}
