import Link from "next/link";
import type { TenantShellConfig } from "@/lib/tenants/shell";

export default function TenantFooterMinimal({ shell }: { shell: TenantShellConfig }) {
  return (
    <footer className="tenant-footer-minimal bg-gray-50 border-t py-4" data-shell={"minimal"}>
      <div className="container mx-auto px-4 text-center text-sm text-gray-600">
        {shell.poweredByEnabled ? (
          <Link href={shell.poweredByUrl || "https://bellu.ch"} className="hover:underline">
            Powered by DigiEmu
          </Link>
        ) : (
          <span>{shell.siteName || "DigiEmu"}</span>
        )}
      </div>
    </footer>
  );
}
