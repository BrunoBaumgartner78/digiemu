// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
// import { ThemeProvider } from "next-themes";
// ⬇️ Pfad prüfen – meistens so oder ähnlich:
// import { ToastProvider } from "@/components/ui/use-toast";

type Props = {
  children: React.ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <SessionProvider>
          {children}
      {children}
    </SessionProvider>
  );
}
