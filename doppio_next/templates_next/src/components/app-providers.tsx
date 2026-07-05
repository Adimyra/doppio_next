"use client";

import { useEffect } from "react";
import { FrappeProvider } from "frappe-react-sdk";
import { ensureCsrfToken } from "@/lib/csrf";

/**
 * Wires frappe-react-sdk to the Frappe backend.
 * - url "" → same origin (dev proxy / production nginx)
 * - socketPort 9000 → Frappe realtime (dev)
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
      enableSocket
      socketPort="9000"
      siteName={
        typeof window !== "undefined" ? window.location.hostname : undefined
      }
    >
      {children}
    </FrappeProvider>
  );
}
