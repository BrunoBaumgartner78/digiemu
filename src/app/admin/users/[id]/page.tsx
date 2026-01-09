import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminUserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  if (!user) return notFound();

  return (
    <main style={{ padding: 24 }}>
      <h1>User</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </main>
  );
}
