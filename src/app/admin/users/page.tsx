import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../api/auth/[...nextauth]/route";
// Removed unused Link import

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return <div className="max-w-xl mx-auto py-12 px-4 text-center">Nicht berechtigt.</div>;
  }
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">User-Verwaltung</h1>
      <table className="min-w-full bg-[#232323] rounded-lg">
        <thead>
          <tr className="text-left text-white">
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Rolle</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t border-gray-700 text-white">
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.role}</td>
              <td className="px-4 py-2">{user.isBlocked ? "Gesperrt" : "Aktiv"}</td>
              <td className="px-4 py-2 flex gap-2">
                {/* PATCH-Formulare für Rolle und Blocken */}
                <form action={`/api/admin/users/${user.id}`} method="POST">
                  <select name="role" defaultValue={user.role} className="px-2 py-1 rounded">
                    <option value="BUYER">BUYER</option>
                    <option value="VENDOR">VENDOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button type="submit" className="ml-2 px-2 py-1 bg-blue-500 rounded text-white">Setzen</button>
                </form>
                <form action={`/api/admin/users/${user.id}`} method="POST">
                  <input type="hidden" name="_method" value="PATCH" />
                  <input type="hidden" name="block" value={user.isBlocked ? "false" : "true"} />
                  <button type="submit" className={`px-2 py-1 rounded text-white ${user.isBlocked ? "bg-green-500" : "bg-red-500"}`}>{user.isBlocked ? "Entsperren" : "Blockieren"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
