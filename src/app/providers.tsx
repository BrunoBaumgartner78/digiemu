"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/use-toast";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
