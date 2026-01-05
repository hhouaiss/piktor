"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme Provider Component
 *
 * Wraps the application with next-themes provider to enable theme switching
 * Supports: light, dark, and system (auto) modes
 * Default: system preference
 * Theme preference is persisted in localStorage
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
