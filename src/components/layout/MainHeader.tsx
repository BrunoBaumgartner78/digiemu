"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Preise" },
  { href: "/help", label: "Hilfe" },
];

export function MainHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const inAccount = pathname.startsWith("/account");

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Logo */}
        <Link href="/" className="app-logo">
          <span className="app-logo-main">DIGIEMU</span>
          <span className="app-logo-sub">DIGITAL MARKETPLACE</span>
        </Link>

        {/* Hauptnavigation Desktop */}
        <nav className="app-nav-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                "app-nav-link" +
                (pathname === link.href ? " app-nav-link-active" : "")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Rechts: Auth / Dashboard */}
        <div className="app-header-right">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className={`nav-pill ${
                  isDashboard ? "nav-pill-primary" : "nav-pill-ghost"
                }`}
              >
                Dashboard
              </Link>
              {session.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`nav-pill ${
                    isAdmin ? "nav-pill-primary" : "nav-pill-ghost"
                  }`}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account/profile"
                className={`nav-pill ${
                  inAccount ? "nav-pill-primary" : "nav-pill-ghost"
                }`}
              >
                Profil
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="nav-pill nav-pill-ghost"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-pill nav-pill-ghost">
                Login
              </Link>
              <Link
                href="/register"
                className="nav-pill nav-pill-primary"
              >
                Registrieren
              </Link>
            </>
          )}

          {/* Nur Mobile: Hamburger */}
          <button
            type="button"
            className="menu-button md:hidden"
            aria-label="Menü öffnen"
            onClick={() => setMobileOpen(true)}
          >
            <span className="menu-icon" />
          </button>
        </div>
      </div>

      {/* Mobiles Overlay-Menü */}
      {mobileOpen && (
        <div className="mobile-overlay">
          <div className="mobile-drawer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] opacity-70">
                  Navigation
                </div>
                <div className="text-sm font-semibold">
                  Digital Marketplace
                </div>
              </div>
              <button
                type="button"
                className="nav-pill nav-pill-ghost"
                onClick={() => setMobileOpen(false)}
              >
                Schließen
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="mobile-nav-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {session.user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="mobile-nav-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/account/profile"
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    className="mobile-nav-link text-left"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="mobile-nav-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    Registrieren
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
