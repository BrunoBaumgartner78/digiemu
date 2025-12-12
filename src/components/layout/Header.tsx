"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const user = session?.user;
  const isVendor = user?.role === "VENDOR";
  const isAdmin = user?.role === "ADMIN";

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
          {isVendor && <Link href="/dashboard" className="nav-link">Dashboard</Link>}
          {isAdmin && <Link href="/admin/products" className="nav-link">Admin</Link>}
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
            {isVendor && <Link href="/dashboard" className="nav-link" onClick={toggleMenu}>Dashboard</Link>}
            {isAdmin && <Link href="/admin/products" className="nav-link" onClick={toggleMenu}>Admin</Link>}
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
