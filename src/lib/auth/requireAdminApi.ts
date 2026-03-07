
// src/lib/auth/requireAdminApi.ts
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminApi as requireCentralAdminApi } from "@/lib/guards/authz";

type AdminApiResult =
  | { ok: true; userId: string }
  | { ok: false; res: Response };

export async function requireAdminApi(_req: NextRequest): Promise<AdminApiResult> {
  const sessionOrResponse = await requireCentralAdminApi();
  if (sessionOrResponse instanceof NextResponse) {
    return {
      ok: false,
      res: sessionOrResponse,
    };
  }

  return { ok: true, userId: sessionOrResponse.user.id };
}
