"use client";

import "./MainHeader.css";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { debug } from "@/lib/debug";
import { signOut, useSession } from "next-auth/react";

import FeatureGate from "@/components/FeatureGate";

type Role = "ADMIN" | "VENDOR" | "BUYER" | undefined;

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Preise" },
  { href: "/help", label: "Hilfe" },
];

export function MainHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  const role: Role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR" || role === "ADMIN";
  const isBuyer = role === "BUYER";

  useEffect(() => {
    debug.log("[MainHeader] role check", { status, role, isAdmin });
  }, [status, role, isAdmin]);

  // ✅ Scroll lock when mobile menu open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? "hidden" : prevOverflow || "";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "/";

  const AdminLink = (
    <Link
      href="/admin"
      className={"nav-pill nav-pill-ghost" + (isActive("/admin") ? " nav-pill-active" : "")}
    >
      Admin
    </Link>
  );

  return (
    <header className="main-header" data-mobile-open={mobileOpen ? "true" : "false"}>
      <div className="header-inner">
        {/* ✅ BRAND / LOGO */}
        <Link href="/" className="logo-lockup" onClick={() => setMobileOpen(false)} aria-label="Bellu Startseite">
          <span className="logo-mark" aria-hidden="true">
            <Image
              src="/logo-transparent.png"
              alt="Bellu"
              width={38}
              height={38}
              priority
              className="logo-img"
            />
          </span>

          {/* optional: Brand Text neben Logo */}
          <span className="logo-main">Bellu</span>
          <span className="logo-sub">Marketplace</span>
        </Link>

        <nav className="primary-nav" aria-label="Navigation">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={"nav-pill nav-pill-small" + (isActive(link.href) ? " nav-pill-active" : "")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {isAuthLoading ? (
            <span className="nav-pill nav-pill-ghost" aria-label="Lade Session…">…</span>
          ) : isLoggedIn ? (
            <>
              <Link
                href="/account/downloads"
                className={"nav-pill nav-pill-ghost" + (isActive("/account/downloads") ? " nav-pill-active" : "")}
              >
                Downloads
              </Link>

              {isBuyer && (
                <Link
                  href="/account/orders"
                  className={"nav-pill nav-pill-ghost" + (isActive("/account/orders") ? " nav-pill-active" : "")}
                >
                  Bestellungen
                </Link>
              )}

              {isVendor && (
                <Link
                  href="/dashboard"
                  className={"nav-pill nav-pill-ghost" + (isActive("/dashboard") ? " nav-pill-active" : "")}
                >
                  Dashboard
                </Link>
              )}

              {isVendor && (
                <Link
                  href="/dashboard/products/top"
                  className={"nav-pill nav-pill-ghost" + (isActive("/dashboard/products/top") ? " nav-pill-active" : "")}
                >
                  Top-Produkte
                </Link>
              )}

              {role === "VENDOR" && (
                <Link
                  href="/dashboard/vendor"
                  className={"nav-pill nav-pill-ghost" + (isActive("/dashboard/vendor") ? " nav-pill-active" : "")}
                >
                  Analytics
                </Link>
              )}

              {isAdmin ? (
                <FeatureGate feature="admin" fallback={AdminLink}>
                  {AdminLink}
                </FeatureGate>
              ) : null}

              <Link
                href="/account/profile"
                className={"nav-pill nav-pill-ghost" + (isActive("/account/profile") ? " nav-pill-active" : "")}
              >
                Profil
              </Link>

              <button className="nav-pill nav-pill-outline" onClick={() => signOut({ callbackUrl: "/" })}>
                Logout
              </button>
            </>
          ) : (
            <>
              {/* ✅ align with your existing auth routes */}
              <Link
                href="/auth/login"
                className={"nav-pill nav-pill-ghost" + (isActive("/auth/login") ? " nav-pill-active" : "")}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className={"nav-pill nav-pill-ghost" + (isActive("/auth/register") ? " nav-pill-active" : "")}
              >
                Konto erstellen
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={"hamburger-btn" + (mobileOpen ? " is-open" : "")}
          aria-label="Navigation öffnen"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="hamburger-inner">
            <span className="hamburger-line line-1" />
            <span className="hamburger-line line-2" />
            <span className="hamburger-line line-3" />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-nav-wrapper" role="dialog" aria-modal="true">
          <button className="mobile-nav-backdrop" onClick={() => setMobileOpen(false)} aria-label="Menü schließen" />

          <div className="mobile-nav-card">
            <div className="mobile-nav-header">
              <div className="mobile-nav-title">
                <span className="mobile-nav-kicker">Navigation</span>
                <span className="mobile-nav-brand">Bellu Marketplace</span>
              </div>
              <button className="mobile-nav-close" onClick={() => setMobileOpen(false)}>
                Schließen
              </button>
            </div>

            <nav className="mobile-nav-list">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={"mobile-nav-pill" + (isActive(link.href) ? " mobile-nav-pill-active" : "")}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mobile-nav-divider" />

              {isAuthLoading ? (
                <span className="mobile-nav-pill" aria-label="Lade Session…">…</span>
              ) : isLoggedIn ? (
                <>
                  {isVendor && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={"mobile-nav-pill" + (isActive("/dashboard") ? " mobile-nav-pill-active" : "")}
                    >
                      Dashboard
                    </Link>
                  )}

                  <Link
                    href="/account/downloads"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/account/downloads") ? " mobile-nav-pill-active" : "")}
                  >
                    Downloads
                  </Link>

                  {isBuyer && (
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      className={"mobile-nav-pill" + (isActive("/account/orders") ? " mobile-nav-pill-active" : "")}
                    >
                      Bestellungen
                    </Link>
                  )}

                  {role === "VENDOR" && (
                    <Link
                      href="/dashboard/vendor"
                      onClick={() => setMobileOpen(false)}
                      className={"mobile-nav-pill" + (isActive("/dashboard/vendor") ? " mobile-nav-pill-active" : "")}
                    >
                      Analytics
                    </Link>
                  )}

                  {isAdmin ? (
                    <FeatureGate feature="admin" fallback={null}>
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={"mobile-nav-pill" + (isActive("/admin") ? " mobile-nav-pill-active" : "")}
                      >
                        Admin
                      </Link>
                    </FeatureGate>
                  ) : null}

                  <Link
                    href="/account/profile"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/account/profile") ? " mobile-nav-pill-active" : "")}
                  >
                    Profil
                  </Link>

                  <button
                    type="button"
                    className="mobile-nav-pill mobile-nav-logout"
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
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/auth/login") ? " mobile-nav-pill-active" : "")}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/auth/register") ? " mobile-nav-pill-active" : "")}
                  >
                    Konto erstellen
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
