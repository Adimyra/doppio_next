# "CSRF Token missing or incorrect" — Next.js static export served by Frappe (production only)

## TL;DR

Your frontend authenticates with **session cookies**, and Frappe requires every cookie-authenticated
**POST/PUT/DELETE** request to also carry the header `X-Frappe-CSRF-Token`. Your app never sends it.

- **Login works** because `/api/method/login` is exempt from the CSRF check (you don't have a session yet).
- **Reads work** because GET requests are never CSRF-checked.
- **Dev works** because your local site almost certainly has CSRF checking disabled
  (`"ignore_csrf": 1` in `site_config.json` and/or `developer_mode` — the standard setup for
  developing against a Vite/Next proxy). The proxy itself doesn't fix anything; the check is simply
  off locally and **on** in production.
- **Static export makes it worse**: on a normal Frappe web page, the server renders the HTML through
  Jinja and injects `frappe.csrf_token` into the page. With `output: 'export'`, your HTML files are
  pre-built at build time and served as static assets — there is no server-side render step, so the
  token is never injected into the page. Your JS has no token, so document saves get a 400
  `CSRFTokenError`.

## How the mechanism works

1. When a user logs in, Frappe generates a per-session `csrf_token` and stores it in the session.
2. On every non-GET request authenticated via the `sid` cookie, `frappe.auth` compares the
   `X-Frappe-CSRF-Token` request header against the session's token. Missing or wrong → HTTP 400
   "CSRF Token missing or incorrect".
3. Requests authenticated with `Authorization: token api_key:api_secret` (or Bearer/OAuth) are *not*
   CSRF-checked — which is why server-to-server integrations never see this error.

So the fix is always the same: **get the session's CSRF token into your frontend, and send it as a
header on every mutating request.**

## Fix (recommended): fetch the token at runtime after login

This is the cleanest approach for a static export, because it needs no server-side HTML rendering.

### 1. Expose the token via a tiny whitelisted endpoint

In your Frappe app (e.g. `your_app/api.py`):

```python
import frappe

@frappe.whitelist()
def get_csrf_token():
    # GET requests are not CSRF-checked, so this is safe to call
    frappe.local.response["csrf_token"] = frappe.sessions.get_csrf_token()
```

(If your Frappe version already ships a whitelisted CSRF endpoint, use that instead — the custom
method above works on any version.)

### 2. Fetch it after login / on app boot, and attach it to every mutating request

```ts
// csrf.ts
let csrfToken: string | undefined;

export async function refreshCsrfToken() {
  const res = await fetch("/api/method/your_app.api.get_csrf_token", {
    credentials: "include",          // send the sid cookie
  });
  const data = await res.json();
  csrfToken = data.csrf_token;
  // frappe-ui / frappe-js-sdk read window.csrf_token automatically:
  (window as any).csrf_token = csrfToken;
  return csrfToken;
}

export async function frappeFetch(url: string, options: RequestInit = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("X-Frappe-Site-Name", window.location.hostname);
  if (method !== "GET" && csrfToken) {
    headers.set("X-Frappe-CSRF-Token", csrfToken);
  }
  return fetch(url, { ...options, headers, credentials: "include" });
}
```

Call `refreshCsrfToken()`:
- once on app startup (if the user already has a session), and
- **again immediately after every successful login** — logging in creates a new session, so any
  previously cached token is stale.

Also handle the failure case defensively: if a POST comes back 400 with `CSRFTokenError`, re-fetch
the token once and retry.

If you use **frappe-js-sdk** or **frappe-ui**, you don't need a custom fetch wrapper — they pick up
`window.csrf_token` automatically; just make sure you set it before the first mutation.

## Alternative fix: inject the token into the HTML at serve time

This is what the classic Doppio/SPA setup does. Since Frappe is the thing serving your files at
`/portal`, you can serve the HTML **through Frappe's Jinja renderer** instead of as a raw static
file, and let it inject the token:

```html
<script>
  window.csrf_token = '{{ frappe.session.csrf_token }}';
</script>
```

Files placed under an app's `www/` directory are rendered as Jinja templates per-request, so the
placeholder gets replaced with the live session token. Caveats that make this clunkier for Next.js
static export than for a single-page Vite build:

- `output: 'export'` produces **many** HTML files (one per route), and each one entering the browser
  cold needs the injection — you'd have to post-process every exported `.html` at build time to add
  the snippet.
- Next.js output can contain `{{ }}`-like sequences that Jinja will choke on; you may need to guard
  or escape them.
- **Never cache the rendered HTML** (no CDN/proxy caching, `Cache-Control: no-store` on the HTML):
  the token is per-session, so a cached page hands user B user A's token (broken saves at best,
  token leakage at worst). Keep long caching for `_next/static/*` assets only.

If your serving path renders only `index.html`/the route's HTML through Frappe and serves the rest
statically, this works fine — but the runtime-fetch approach above avoids all of these edge cases,
which is why I'd prefer it for `output: 'export'`.

## Things that "work" but you should NOT do

- **`"ignore_csrf": 1` in the production `site_config.json`** — this makes the error go away by
  disabling CSRF protection entirely, leaving every logged-in user open to cross-site request
  forgery. Fine for a local dev bench, never for production.
- **Switching browser calls to `api_key:api_secret` token auth** — bypasses CSRF because it's not
  cookie auth, but it means shipping credentials to the browser and losing per-user sessions. Only
  appropriate for server-side calls.

## Checklist

1. Add a whitelisted `get_csrf_token` endpoint (or reuse an existing one).
2. On boot and after every login, GET it with `credentials: "include"` and store it
   (set `window.csrf_token` if you use frappe-ui / frappe-js-sdk).
3. Send `X-Frappe-CSRF-Token` on every POST/PUT/DELETE.
4. On a 400 `CSRFTokenError`, refresh the token once and retry.
5. Keep production CSRF checking **on**; keep `ignore_csrf` only in your local dev site config.
6. If you instead inject the token into served HTML, disable caching for the HTML documents.

After step 3, your document saves at `/portal` will pass Frappe's CSRF validation with the same
session cookie you're already using.
