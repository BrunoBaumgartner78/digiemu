"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const isClient = typeof window !== "undefined";

  const user = session?.user;
  const role = (session?.user as any)?.role;
  const isVendor = role === "VENDOR";
  const isAdmin = role === "ADMIN";

  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <header className="w-full border-b border-black/5 bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">DigiEmu</span>
        </Link>
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/shop" className="nav-link">Shop</Link>
          {user && <Link href="/account/buyer-profile" className="nav-link">Buyer-Profil</Link>}
          {isVendor && <Link href="/dashboard" className="nav-link">Dashboard</Link>}
          {isVendor && <Link href="/account/profile" className="nav-link">Verkäufer-Profil</Link>}
          {isAdmin && <Link href="/admin" className="nav-link">Admin</Link>}
          {isAdmin && <Link href="/account/admin-profile" className="nav-link">Admin-Profil</Link>}
          {isClient && !user && (
            <>
              <Link href="/auth/login" className="neobtn-sm">Login</Link>
              <Link href="/auth/register" className="neobtn-sm ghost">Registrieren</Link>
            </>
          )}
          {user && (
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="neobtn-sm ghost">Logout</button>
            </form>
          )}
        </nav>
        {/* Mobile Toggle */}
        <button className="md:hidden neobtn-sm" onClick={toggleMenu} aria-label="Menü">☰</button>
      </div>
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-black/5 bg-[var(--bg)]/90 backdrop-blur-md">
          <nav className="flex flex-col p-4 gap-3">
            <Link href="/shop" className="nav-link" onClick={toggleMenu}>Shop</Link>
            {user && <Link href="/account/buyer-profile" className="nav-link" onClick={toggleMenu}>Buyer-Profil</Link>}
            {isVendor && <Link href="/dashboard" className="nav-link" onClick={toggleMenu}>Dashboard</Link>}
            {isVendor && <Link href="/account/profile" className="nav-link" onClick={toggleMenu}>Verkäufer-Profil</Link>}
            {isAdmin && <Link href="/admin" className="nav-link" onClick={toggleMenu}>Admin</Link>}
            {isAdmin && <Link href="/account/admin-profile" className="nav-link" onClick={toggleMenu}>Admin-Profil</Link>}
            {isClient && !user && (
              <>
                <Link href="/auth/login" className="neobtn-sm" onClick={toggleMenu}>Login</Link>
                <Link href="/auth/register" className="neobtn-sm ghost" onClick={toggleMenu}>Registrieren</Link>
              </>
            )}
            {user && (
              <form action="/api/auth/signout" method="post">
                <button type="submit" className="neobtn-sm ghost" onClick={toggleMenu}>Logout</button>
              </form>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
