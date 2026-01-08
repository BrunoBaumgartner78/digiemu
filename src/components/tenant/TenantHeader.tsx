import Link from "next/link";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import type { TenantShellConfig } from "@/lib/tenants/shell";
import type { TenantCapabilities } from "@/lib/tenants/capabilities";

type Props = {
  shell: TenantShellConfig;
  capabilities: TenantCapabilities;
};

export default async function TenantHeader({ shell, capabilities }: Props) {
  const session = await getServerSession(auth);
  const isLoggedIn = !!session?.user?.id;

  return (
    <header className="tenant-header bg-white border-b" data-shell={"default"}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={shell.homeUrl || "/shop"} className="flex items-center gap-3">
            {shell.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shell.logoUrl} alt={shell.siteName || "DigiEmu"} style={{ height: 36 }} />
            ) : (
              <span className="font-semibold">{shell.siteName || "DigiEmu"}</span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-3">
            <Link href="/shop" className="nav-pill">
              Shop
            </Link>
            {capabilities.vendorSell ? (
              <Link href="/become-seller" className="nav-pill">
                Sell
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
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
          ) : (
            <>
              <Link href="/account/profile" className="nav-pill">
                Account
              </Link>
              {capabilities.vendorSell ? (
                <Link href="/dashboard" className="nav-pill nav-pill-ghost">
                  Dashboard
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
