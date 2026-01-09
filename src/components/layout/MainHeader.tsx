"use client";

import "./MainHeader.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

// OPTIONAL: nur importieren wenn du es wirklich nutzt
import FeatureGate from "@/components/FeatureGate";

type Role = "ADMIN" | "VENDOR" | "BUYER" | undefined;

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Content OS" },
  { href: "/pricing", label: "Preise" },
  { href: "/help", label: "Hilfe" },
];

// Option B: Debug-Logger (Client) – nur wenn explizit via NEXT_PUBLIC Flag aktiviert
const isDebug = process.env.NEXT_PUBLIC_DEBUG_MAINHEADER === "1";
const dbg = (...args: any[]) => {
  if (isDebug) console.log(...args);
};

type Props = {
  variant?: "DEFAULT" | "MINIMAL";
  tenantBrand?: { name?: string; logoUrl?: string | null } | null;
  showAuthLinks?: boolean;
  showNavLinks?: boolean;
  headerVariantName?: string | undefined;
};

export function MainHeader(props: Props) {
  const {
    variant = "DEFAULT",
    tenantBrand = null,
    showAuthLinks = true,
    showNavLinks = true,
  } = props;

  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  const role: Role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR" || role === "ADMIN";
  const isBuyer = role === "BUYER";

  useEffect(() => {
    // bewusst ohne session.user, damit keine sensiblen Daten im Browser-Log landen
    dbg("[MainHeader] role check", { status, role, isAdmin, isVendor, isBuyer });
  }, [status, role, isAdmin, isVendor, isBuyer]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? "hidden" : prevOverflow || "";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  // ✅ Tenants link (admin-only)
  const TenantsLink = (
    <Link
      href="/admin/tenants"
      className={"nav-pill nav-pill-ghost" + (isActive("/admin/tenants") ? " nav-pill-active" : "")}
    >
      Tenants
    </Link>
  );

  const isMinimal = variant === "MINIMAL";

  return (
    <header className="main-header" data-mobile-open={mobileOpen ? "true" : "false"}>
      <div className="header-inner">
        <Link href="/" className="logo-lockup" onClick={() => setMobileOpen(false)}>
          {tenantBrand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenantBrand.logoUrl} alt={tenantBrand?.name || ""} className="logo-main" />
          ) : (
            <>
              <span className="logo-main">{tenantBrand?.name || "DigiEmu"}</span>
              {!isMinimal && <span className="logo-sub">Digital Content OS</span>}
            </>
          )}
        </Link>

        {/* NAV LINKS */}
        {showNavLinks ? (
          <nav className="primary-nav" aria-label="Navigation">
            {isMinimal ? (
              <ul className="flex items-center gap-4 text-sm">
                <li>
                  <Link href="/shop">Shop</Link>
                </li>
              </ul>
            ) : (
              mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={"nav-pill nav-pill-small" + (isActive(link.href) ? " nav-pill-active" : "")}
                >
                  {link.label}
                </Link>
              ))
            )}
          </nav>
        ) : (
          <div />
        )}

        {/* AUTH LINKS / ACCOUNT LINKS */}
        <div className="header-actions">
          {!showAuthLinks ? null : isAuthLoading ? (
            <span className="nav-pill nav-pill-ghost" aria-label="Lade Session…">
              …
            </span>
          ) : isLoggedIn ? (
            <>
              <Link
                href="/account/downloads"
                className={
                  "nav-pill nav-pill-ghost" +
                  (isActive("/account/downloads") ? " nav-pill-active" : "")
                }
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
                  className={
                    "nav-pill nav-pill-ghost" +
                    (isActive("/dashboard/products/top") ? " nav-pill-active" : "")
                  }
                >
                  Top-Produkte
                </Link>
              )}

              {/* Vendor-only Analytics */}
              {role === "VENDOR" && (
                <Link
                  href="/dashboard/vendor"
                  className={"nav-pill nav-pill-ghost" + (isActive("/dashboard/vendor") ? " nav-pill-active" : "")}
                >
                  Analytics
                </Link>
              )}

              {/* ✅ Admin-only: Admin + Tenants */}
              {isAdmin ? (
                <FeatureGate feature="admin" fallback={<>{AdminLink}{TenantsLink}</>}>
                  <>
                    {AdminLink}
                    {TenantsLink}
                  </>
                </FeatureGate>
              ) : null}

              <Link
                href="/profile"
                className={"nav-pill nav-pill-ghost" + (isActive("/profile") ? " nav-pill-active" : "")}
              >
                Profil
              </Link>

              <button
                className="nav-pill nav-pill-outline"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={"nav-pill nav-pill-ghost" + (isActive("/login") ? " nav-pill-active" : "")}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={"nav-pill nav-pill-ghost" + (isActive("/register") ? " nav-pill-active" : "")}
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
          <button
            className="mobile-nav-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Menü schließen"
          />

          <div className="mobile-nav-card">
            <div className="mobile-nav-header">
              <div className="mobile-nav-title">
                <span className="mobile-nav-kicker">Navigation</span>
                <span className="mobile-nav-brand">Digital Content OS</span>
              </div>
              <button className="mobile-nav-close" onClick={() => setMobileOpen(false)}>
                Schließen
              </button>
            </div>

            <nav className="mobile-nav-list">
              {showNavLinks ? (
                <>
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
                </>
              ) : null}

              {!showAuthLinks ? null : isAuthLoading ? (
                <span className="mobile-nav-pill" aria-label="Lade Session…">
                  …
                </span>
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

                  {/* ✅ Admin-only: Admin + Tenants */}
                  {isAdmin ? (
                    <FeatureGate feature="admin" fallback={null}>
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className={"mobile-nav-pill" + (isActive("/admin") ? " mobile-nav-pill-active" : "")}
                        >
                          Admin
                        </Link>

                        <Link
                          href="/admin/tenants"
                          onClick={() => setMobileOpen(false)}
                          className={"mobile-nav-pill" + (isActive("/admin/tenants") ? " mobile-nav-pill-active" : "")}
                        >
                          Tenants
                        </Link>
                      </>
                    </FeatureGate>
                  ) : null}

                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/profile") ? " mobile-nav-pill-active" : "")}
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
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/login") ? " mobile-nav-pill-active" : "")}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={"mobile-nav-pill" + (isActive("/register") ? " mobile-nav-pill-active" : "")}
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
