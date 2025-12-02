"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"        // schreibt "class='light'" oder "class='dark'" auf <html>
      defaultTheme="dark"      // Start im Dark-Mode
      enableSystem={false}     // System-Theme ignorieren -> nur Toggle steuert
    >
      {children}
    </NextThemesProvider>
  );
}
