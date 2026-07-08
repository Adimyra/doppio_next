"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWebsiteSettings } from "@/lib/website-settings";

/** Set once the visitor picks a theme themselves — from then on their
 *  choice wins over the site default from Website Settings. */
const USER_CHOICE_KEY = "theme-user-choice";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SiteDefaultTheme />
      {children}
    </NextThemesProvider>
  );
}

/** Applies Website Settings → Adi Settings → Default Website Theme
 *  until the visitor toggles the theme manually. */
function SiteDefaultTheme() {
  const ws = useWebsiteSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    const preferred = ws?.default_website_theme;
    if (!preferred) return;
    if (localStorage.getItem(USER_CHOICE_KEY)) return;
    setTheme(preferred.toLowerCase());
  }, [ws, setTheme]);

  return null;
}

/** Sun/moon button that flips between light and dark. */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => {
        localStorage.setItem(USER_CHOICE_KEY, "1");
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      {/* render both; CSS picks the visible one to avoid hydration flicker */}
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
