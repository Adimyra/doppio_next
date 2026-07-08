"use client";

import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";

export interface TopBarItem {
  label: string;
  url?: string;
  parent_label?: string;
  right?: 0 | 1;
  open_in_new_tab?: 0 | 1;
}

export interface WebsiteSettings {
  app_name?: string;
  app_logo?: string;
  banner_image?: string;
  favicon?: string;
  disable_signup?: 0 | 1;
  hide_login?: 0 | 1;
  show_footer_on_login?: 0 | 1;
  hide_footer_signup?: 0 | 1;
  navbar_search?: 0 | 1;
  copyright?: string;
  address?: string;
  top_bar_items?: TopBarItem[];
  footer_items?: TopBarItem[];
}

/**
 * Website Settings from the Frappe site (guest-accessible subset).
 * Returns null while loading — callers keep their static fallbacks
 * until the settings arrive, so nothing flashes or breaks offline.
 */
export function useWebsiteSettings(): WebsiteSettings | null {
  const { data } = useFrappeGetCall<{ message: WebsiteSettings }>(
    "__APP__.website_api.get_website_settings",
    undefined,
    "website-settings",
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  return data?.message ?? null;
}

export interface SessionUser {
  user: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  user_image?: string;
  mobile_no?: string;
  phone?: string;
  desk_access?: boolean;
}

/** Profile of the logged-in user (null while loading or logged out). */
export function useSessionUser(): {
  sessionUser: SessionUser | null;
  refresh: () => void;
} {
  const { currentUser } = useFrappeAuth();
  const { data, mutate } = useFrappeGetCall<{ message: SessionUser }>(
    "__APP__.website_api.get_session_user",
    undefined,
    // null key skips the request entirely while logged out
    currentUser ? "session-user" : null,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  return {
    sessionUser: currentUser ? (data?.message ?? null) : null,
    refresh: () => void mutate(),
  };
}

/** Brand image for headers: Website Settings "Brand Image" wins, then App Logo. */
export function brandImage(ws: WebsiteSettings | null): string | undefined {
  return ws?.banner_image || ws?.app_logo || undefined;
}

/**
 * Resolve a Top Bar Item url for the SPA.
 * - absolute http(s) urls are used as-is (external)
 * - "/home" and "/index" mean the SPA home
 * - other site-relative urls become SPA routes (Next adds the basePath)
 */
export function resolveItemUrl(url?: string): {
  href: string;
  external: boolean;
} {
  if (!url) return { href: "#", external: false };
  if (/^https?:\/\//.test(url)) return { href: url, external: true };
  const path = url.startsWith("/") ? url : `/${url}`;
  if (path === "/home" || path === "/index") {
    return { href: "/", external: false };
  }
  return { href: path, external: false };
}
