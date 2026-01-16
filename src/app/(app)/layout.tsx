import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { MainHeader } from "@/components/layout/MainHeader";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <ToastProvider>
        <MainHeader />
        <div className="page-shell">
          <main className="page-main">{children}</main>
        </div>
      </ToastProvider>
    </Providers>
  );
}
