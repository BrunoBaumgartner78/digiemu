"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="data-theme"        // schreibt data-theme="light" / "dark" auf <html>
      defaultTheme="system"         // respect system preference by default
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
