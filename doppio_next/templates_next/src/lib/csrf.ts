/**
 * CSRF bootstrap.
 *
 * Static-export mode: Frappe injects `window.csrf_token` via Jinja into the
 * served HTML — this helper is a no-op.
 *
 * Standalone mode: the HTML is served by Next, not Frappe, so we fetch the
 * token once per session. `frappe.sessions.get_csrf_token` may not be
 * whitelisted on your site; if you get a 403/404, add this to your app:
 *
 *   # __APP__/api.py
 *   import frappe
 *
 *   @frappe.whitelist()
 *   def csrf_token():
 *       return frappe.sessions.get_csrf_token()
 *
 * and set CSRF_METHOD below to "__APP__.api.csrf_token".
 */

const CSRF_METHOD = "frappe.sessions.get_csrf_token";

let pending: Promise<void> | null = null;

export function ensureCsrfToken(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.csrf_token && window.csrf_token !== "{{ csrf_token }}") {
    return Promise.resolve();
  }
  if (pending) return pending;

  pending = fetch(`/api/method/${CSRF_METHOD}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      if (data.message) window.csrf_token = data.message;
    })
    .catch(() => {
      /* stay Guest-only until login sets a session */
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}
