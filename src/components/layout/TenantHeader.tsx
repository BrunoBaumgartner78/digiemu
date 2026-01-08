import Link from "next/link";
import { getServerSession } from "next-auth";
import TenantHeaderDefault from "@/components/tenant/TenantHeader";
import TenantHeaderMinimal from "@/components/tenant/TenantHeaderMinimal";
import type { TenantShellConfig } from "@/lib/tenants/shell";
import type { ShellVariant } from "@/lib/tenants/shell";
import type { TenantCapabilities } from "@/lib/tenants/capabilities";

type Props = {
  tenant: any;
  shellConfig: TenantShellConfig;
  shellResolved: { shellVariant: ShellVariant; footerVariant: string; cfg: any; mode: string };
  capabilities: TenantCapabilities;
};

export default async function TenantHeader({ tenant, shellConfig, shellResolved, capabilities }: Props) {
  const session = await getServerSession();
  const isLoggedIn = !!(session as any)?.user?.id;

  // If headerMode explicitly set to HIDDEN, render nothing
  if ((shellResolved as any).headerMode === "HIDDEN") return null;

  // If headerMode is SHOP_ONLY (white-label default), render minimal header
  if ((shellResolved as any).headerMode === "SHOP_ONLY" || shellResolved.shellVariant === "MINIMAL") {
    return <TenantHeaderMinimal shell={shellConfig} />;
  }

  // DEFAULT: reuse existing tenant header component
  return <TenantHeaderDefault shell={shellConfig} capabilities={capabilities} />;
}
