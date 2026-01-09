import Link from "next/link";
import type { TenantShellConfig } from "@/lib/tenants/shell";

export default function TenantFooter({ shell }: { shell: TenantShellConfig }) {
  return (
    <footer className="tenant-footer bg-gray-50 border-t mt-8">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
        </div>

        <div className="text-sm text-gray-600">
          {shell.homeUrl ? (
            <Link href={shell.homeUrl} className="hover:underline">
              {shell.siteName || "DigiEmu"}
            </Link>
          ) : (
            <span>{shell.siteName || "DigiEmu"}</span>
          )}
          {shell.showPoweredBy ? (
            <span className="ml-2">• Powered by DigiEmu</span>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
