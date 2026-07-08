"use client";

import { useEffect } from "react";
import { FrappeProvider } from "frappe-react-sdk";
import { ensureCsrfToken } from "@/lib/csrf";
import { ThemeProvider } from "@/components/theme-provider";
import { useWebsiteSettings } from "@/lib/website-settings";

/** Applies Website Settings favicon (falls back to app_logo) at runtime. */
function DynamicFavicon() {
  const ws = useWebsiteSettings();

  useEffect(() => {
    const icon = ws?.favicon || ws?.app_logo;
    if (!icon) return;
    // Next.js owns the default favicon link and resets plain href edits,
    // so drop it and install our own tagged link instead.
    document
      .querySelectorAll("link[rel='icon']:not([data-dynamic-favicon])")
      .forEach((el) => el.remove());
    let link = document.querySelector<HTMLLinkElement>(
      "link[data-dynamic-favicon]"
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-dynamic-favicon", "");
      document.head.appendChild(link);
    }
    link.href = icon;
  }, [ws]);

  return null;
}

/**
 * Wires frappe-react-sdk to the Frappe backend.
 * - url "" → same origin (dev proxy / production nginx)
 * - socketPort __SOCKET_PORT__ → Frappe realtime (dev)
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  // No-op when Frappe injected the token (static mode);
  // fetches it when Next serves the HTML (standalone mode).
  useEffect(() => {
    void ensureCsrfToken();
  }, []);

  return (
    <FrappeProvider
      url=""
      // window-guarded: the SDK derives the socket URL from window.location,
      // which doesn't exist during static-export prerendering
      enableSocket={typeof window !== "undefined"}
      socketPort="__SOCKET_PORT__"
      siteName={
        typeof window !== "undefined" ? window.location.hostname : undefined
      }
    >
      <DynamicFavicon />
      <ThemeProvider>{children}</ThemeProvider>
    </FrappeProvider>
  );
}
