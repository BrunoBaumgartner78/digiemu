import type { ReactNode } from "react";
import Providers from "@/app/providers";
import { MainHeader } from "@/components/layout/MainHeader";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <MainHeader />
      {children}
    </Providers>
  );
}
