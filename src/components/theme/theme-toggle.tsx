"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Theme Toggle Component
 *
 * Provides a UI control for switching between light, dark, and auto (system) themes
 * Features:
 * - Three theme modes: light, dark, auto
 * - Visual indicator for current theme
 * - Smooth transitions
 * - Accessible keyboard navigation
 */
export function ThemeToggle() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        <div className="w-8 h-8" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={cn(
          "h-8 w-8 p-0 transition-all",
          theme === "light"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Mode clair"
        aria-label="Activer le mode clair"
      >
        <Sun className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn(
          "h-8 w-8 p-0 transition-all",
          theme === "dark"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Mode sombre"
        aria-label="Activer le mode sombre"
      >
        <Moon className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={cn(
          "h-8 w-8 p-0 transition-all",
          theme === "system"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Mode automatique (système)"
        aria-label="Activer le mode automatique"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Compact Theme Toggle Component
 *
 * A more compact version that cycles through themes on click
 * Useful for mobile or space-constrained layouts
 */
export function ThemeToggleCompact() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const currentTheme = theme === "system" ? systemTheme : theme;
  const Icon = currentTheme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="h-9 w-9 p-0"
      title={
        theme === "light"
          ? "Mode clair - Cliquer pour mode sombre"
          : theme === "dark"
          ? "Mode sombre - Cliquer pour mode automatique"
          : "Mode automatique - Cliquer pour mode clair"
      }
      aria-label={`Thème actuel: ${theme === "system" ? "automatique" : theme === "dark" ? "sombre" : "clair"}. Cliquer pour changer`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
