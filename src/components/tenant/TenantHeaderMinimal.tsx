import Link from "next/link";
import type { TenantShellConfig } from "@/lib/tenants/shell";

export default function TenantHeaderMinimal({ shell }: { shell: TenantShellConfig }) {
  return (
    <header className="tenant-header-minimal bg-white border-b" data-shell={"minimal"}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={shell.homeUrl || "/shop"} className="flex items-center gap-3">
          {shell.showLogo && shell.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shell.logoUrl} alt={shell.siteName || "DigiEmu"} style={{ height: 36 }} />
          ) : (
            <span className="font-semibold">{shell.siteName || "DigiEmu"}</span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/shop" className="nav-pill">
            Shop
          </Link>
          {shell.showAuthLinks ? (
            <>
              <Link href="/auth/login" className="nav-pill">
                Login
              </Link>
              {shell.showRegister ? (
                <Link href="/register" className="nav-pill nav-pill-ghost">
                  Register
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
