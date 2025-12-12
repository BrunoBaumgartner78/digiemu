"use client";

import "./MainHeader.css";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Preise" },
  { href: "/help", label: "Hilfe" },
];

export function MainHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const isLoggedIn = !!session;
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) && href !== "/";

  return (
    <header
      className="main-header"
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      <div className="header-inner">
        {/* BRAND */}
        <Link href="/" className="logo-lockup">
          <span className="logo-main">DigiEmu</span>
          <span className="logo-sub">Digital Marketplace</span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="primary-nav" aria-label="Navigation">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                "nav-pill nav-pill-small" +
                (isActive(link.href) ? " nav-pill-active" : "")
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* USER ACTIONS */}
        <div className="header-actions">
          {isLoggedIn ? (
            <>
              {/* Dashboard always for logged-in users */}
              <Link
                href="/dashboard"
                className={
                  "nav-pill nav-pill-ghost" +
                  (isActive("/dashboard") ? " nav-pill-active" : "")
                }
              >
                Dashboard
              </Link>

              {/* Top-Produkte only for VENDOR or ADMIN */}
              {userRole && (userRole === "VENDOR" || userRole === "ADMIN") && (
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
              {userRole === "VENDOR" && (
                <Link
                  href="/dashboard/vendor"
                  className={
                    "nav-pill nav-pill-ghost" +
                    (isActive("/dashboard/vendor")
                      ? " nav-pill-active"
                      : "")
                  }
                >
                  Analytics
                </Link>
              )}

              {/* Admin-only */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={
                    "nav-pill nav-pill-ghost" +
                    (isActive("/admin") ? " nav-pill-active" : "")
                  }
                >
                  Admin
                </Link>
              )}

              {/* Profile always for logged-in users */}
              <Link
                href="/profile"
                className={
                  "nav-pill nav-pill-ghost" +
                  (isActive("/profile") ? " nav-pill-active" : "")
                }
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
                className={
                  "nav-pill nav-pill-ghost" +
                  (isActive("/login") ? " nav-pill-active" : "")
                }
              >
                Login
              </Link>
              <Link
                href="/register"
                className={
                  "nav-pill nav-pill-ghost" +
                  (isActive("/register") ? " nav-pill-active" : "")
                }
              >
                Konto erstellen
              </Link>
            </>
          )}
        </div>

        {/* MOBILE HAMBURGER */}
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

      {/* MOBILE MENU OVERLAY */}
      {mobileOpen && (
        <div className="mobile-nav-wrapper" role="dialog" aria-modal="true">
          <button
            className="mobile-nav-backdrop"
            onClick={() => setMobileOpen(false)}
          />

          <div className="mobile-nav-card">
            <div className="mobile-nav-header">
              <div className="mobile-nav-title">
                <span className="mobile-nav-kicker">Navigation</span>
                <span className="mobile-nav-brand">Digital Marketplace</span>
              </div>
              <button
                className="mobile-nav-close"
                onClick={() => setMobileOpen(false)}
              >
                Schließen
              </button>
            </div>

            <nav className="mobile-nav-list">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "mobile-nav-pill" +
                    (isActive(link.href) ? " mobile-nav-pill-active" : "")
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mobile-nav-divider" />

              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={
                      "mobile-nav-pill" +
                      (isActive("/dashboard") ? " mobile-nav-pill-active" : "")
                    }
                  >
                    Dashboard
                  </Link>

                  {userRole === "VENDOR" && (
                    <Link
                      href="/dashboard/vendor"
                      onClick={() => setMobileOpen(false)}
                      className={
                        "mobile-nav-pill" +
                        (isActive("/dashboard/vendor")
                          ? " mobile-nav-pill-active"
                          : "")
                      }
                    >
                      Analytics
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={
                        "mobile-nav-pill" +
                        (isActive("/admin") ? " mobile-nav-pill-active" : "")
                      }
                    >
                      Admin
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={
                      "mobile-nav-pill" +
                      (isActive("/profile") ? " mobile-nav-pill-active" : "")
                    }
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
                    className={
                      "mobile-nav-pill" +
                      (isActive("/login") ? " mobile-nav-pill-active" : "")
                    }
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className={
                      "mobile-nav-pill" +
                      (isActive("/register")
                        ? " mobile-nav-pill-active"
                        : "")
                    }
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
