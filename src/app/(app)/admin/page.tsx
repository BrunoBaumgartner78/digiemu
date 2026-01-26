import { redirect } from "next/navigation";
import { requireAdminOrRedirect } from "@/lib/guards/admin";

export default async function AdminIndexPage() {
  await requireAdminOrRedirect();
  redirect("/admin/downloads");
}
