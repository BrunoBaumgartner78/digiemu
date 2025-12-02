import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#181818]">
      <aside className="w-64 bg-[#232323] p-6 flex flex-col gap-4 text-white">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="hover:text-[#39FF14]">Dashboard</Link>
          <Link href="/admin/users" className="hover:text-[#39FF14]">User</Link>
          <Link href="/admin/products" className="hover:text-[#39FF14]">Produkte</Link>
          <Link href="/admin/vendors" className="hover:text-[#39FF14]">Vendoren</Link>
          <Link href="/admin/payouts" className="hover:text-[#39FF14]">Payouts</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
