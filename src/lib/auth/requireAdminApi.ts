
// src/lib/auth/requireAdminApi.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ggf. Pfad anpassen falls bei dir anders

type AdminApiResult =
  | { ok: true; userId: string }
  | { ok: false; res: Response };

export async function requireAdminApi(_req: NextRequest): Promise<AdminApiResult> {
  const session = await getServerSession(authOptions);

  const role = (session?.user as any)?.role as string | undefined;
  const userId = (session?.user as any)?.id as string | undefined;

  if (!session || role !== "ADMIN" || !userId) {
    return {
      ok: false,
      res: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, userId };
}
