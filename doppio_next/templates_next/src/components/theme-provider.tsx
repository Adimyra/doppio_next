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
      <BrandTheme />
      {children}
    </NextThemesProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Brand colors from Adi Settings                                      */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix `a` toward `b` by t (0..1) and return a hex color. */
function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  const channel = (i: number) => Math.round(ca[i] + (cb[i] - ca[i]) * t);
  return (
    "#" +
    [0, 1, 2]
      .map((i) => channel(i).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Derive the full --brand-* palette from the two Adi Settings colors. */
function buildBrandCss(deep: string, moss: string): string {
  const vars = {
    "--brand-deep": deep,
    "--brand-moss": moss,
    "--brand-mid": mix(deep, moss, 0.5),
    "--brand-soft": mix(moss, "#ffffff", 0.3),
    "--brand-light": mix(moss, "#ffffff", 0.55),
    "--brand-tint": mix(moss, "#ffffff", 0.88),
    "--brand-tint-2": mix(moss, "#ffffff", 0.92),
    "--brand-muted": mix(moss, "#ffffff", 0.94),
    "--brand-muted-fg": mix(deep, "#ffffff", 0.35),
    "--brand-dark-bg": mix(deep, "#000000", 0.55),
    "--brand-dark-card": mix(deep, "#000000", 0.45),
    "--brand-dark-secondary": mix(deep, "#000000", 0.28),
    "--brand-dark-accent": mix(moss, "#000000", 0.62),
    "--brand-dark-fg": mix(moss, "#ffffff", 0.9),
    "--brand-dark-muted-fg": mix(moss, "#ffffff", 0.45),
  };
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
  return `:root { ${body} }`;
}

/** Injects Adi Settings → Brand Colors as CSS variable overrides.
 *  Every themed token (buttons, gradients, accents, dark mode
 *  surfaces) derives from --brand-*, so two colors restyle the site. */
function BrandTheme() {
  const ws = useWebsiteSettings();

  useEffect(() => {
    const deep = ws?.brand_primary_color;
    const moss = ws?.brand_secondary_color;
    if (!hexToRgb(deep ?? "") || !hexToRgb(moss ?? "")) return;
    let el = document.getElementById("brand-theme-overrides");
    if (!el) {
      el = document.createElement("style");
      el.id = "brand-theme-overrides";
      document.head.appendChild(el);
    }
    el.textContent = buildBrandCss(deep!, moss!);
  }, [ws]);

  return null;
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
export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
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
