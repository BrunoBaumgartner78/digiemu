// app/(auth)/reset-password/[token]/page.tsx
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const reset = await prisma.passwordReset.findUnique({
    where: { token: tokenHash },
    select: { id: true, token: true, expiresAt: true, userId: true },
  });

  const now = new Date();
  const isValid = !!reset && reset.expiresAt > now;

  if (!isValid) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white/70 p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Reset-Link ungültig</h1>
          <p className="mt-2 text-sm text-gray-600">
            Dieser Reset-Link ist abgelaufen oder nicht mehr gültig. Bitte fordere
            einen neuen Link an.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium border bg-white"
            >
              Neuer Link
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium border bg-white"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white/70 p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Neues Passwort setzen</h1>
        <p className="mt-2 text-sm text-gray-600">
          Bitte wähle ein neues Passwort für dein Konto.
        </p>

        <div className="mt-6">
          <ResetPasswordForm token={token} />
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Hinweis: Der Link ist zeitlich begrenzt gültig.
        </p>
      </div>
    </main>
  );
}
