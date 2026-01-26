import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/guards/authz";

export async function requireAdminOrRedirect() {
  const session = await requireAdminPage();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}
