import type { ReactNode } from "react";
export const dynamic = "force-dynamic";
import { Providers } from "@/app/providers";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { MainHeader } from "@/components/layout/MainHeader";
import AppFooter from "@/components/layout/AppFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <ToastProvider>
        <MainHeader />
        <div className="page-shell">
          <main className="page-main">{children}</main>
        </div>
        <AppFooter />
      </ToastProvider>
    </Providers>
  );
}
