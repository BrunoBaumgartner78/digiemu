import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { requireSessionPage } from "@/lib/guards/authz";

export async function requireAdmin(): Promise<Session> {
  const session = await requireSessionPage();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return session as Session;
}

