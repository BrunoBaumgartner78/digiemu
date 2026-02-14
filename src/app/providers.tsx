"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/use-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
