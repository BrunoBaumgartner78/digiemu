import Link from "next/link";
import TenantFooterDefault from "@/components/tenant/TenantFooter";
import TenantFooterMinimal from "@/components/tenant/TenantFooterMinimal";
import type { TenantShellConfig } from "@/lib/tenants/shell";
import type { FooterVariant } from "@/lib/tenants/shell";

type Props = {
  tenant: any;
  shellConfig: TenantShellConfig;
  shellResolved: { shellVariant: string; footerVariant: FooterVariant; headerMode?: string; footerMode?: string; cfg: any; mode: string };
};

export default function TenantFooter({ tenant, shellConfig, shellResolved }: Props) {
  // footerMode 'HIDDEN' => no footer
  if ((shellResolved as any).footerMode === "HIDDEN") return null;

  // MINIMAL footer or legacy powered-by variant -> minimal footer
  if ((shellResolved as any).footerMode === "MINIMAL" || shellResolved.footerVariant === "POWERED_BY_ONLY") {
    return <TenantFooterMinimal shell={shellConfig} />;
  }

  return <TenantFooterDefault shell={shellConfig} />;
}
