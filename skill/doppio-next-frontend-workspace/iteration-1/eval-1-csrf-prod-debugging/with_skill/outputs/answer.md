# "CSRF Token missing or incorrect" in production only — diagnosis and fix

## TL;DR

In the Doppio Next **static-export** mode, every POST (`useFrappeUpdateDoc`, `frappeCall`, any save) must carry an `X-Frappe-CSRF-Token` header. frappe-react-sdk reads it from `window.csrf_token`, and in production that value only exists because `scripts/copy-export.mjs` injects

```html
<script>window.csrf_token = '{{ frappe.session.csrf_token }}';</script>
```

into every exported HTML file, and **Frappe renders `www/*.html` through Jinja**, so the token resolves per request. Your saves fail because somewhere in that chain the token is missing, unrendered, or stale. Dev works only because the dev setup masks the problem entirely (see below) — so nothing was ever actually validating your CSRF wiring until production.

## Why dev works but production doesn't

In dev, `next dev` serves the HTML itself — there is **no injected token at all** — and the rewrites proxy `/api/*` to the bench on `:8000`. Saves still work there because either:

- your site/common config has `ignore_csrf: 1` (the standard dev-proxy setting, and what the Doppio docs recommend for development), or
- your dev session simply never had a server-side CSRF token generated, in which case Frappe skips validation.

Production enforces CSRF, so the missing/broken token surfaces only there. This is expected — dev was never testing contract #2 (Auth/CSRF).

## Diagnose in 2 minutes

On the production site, open `https://<site>/portal`, **View Source** (the raw HTML, not the DOM inspector), and search for `csrf_token`. You'll hit one of three cases:

### Case A — the `<script>window.csrf_token = ...</script>` snippet is not there at all

The HTML being served did not go through `copy-export.mjs`. Common ways this happens:

- You ran `next build` and copied `out/` somewhere yourself instead of running the full `yarn build` (`next build && node scripts/copy-export.mjs`).
- You're serving the exported HTML from the app's `public/` folder (i.e. under `/assets/...`), from nginx directly, or via a `website_route_rules` catch-all pointing at static files.

**Fix:** use the pipeline as generated:

```bash
cd apps/<your-app>/portal   # or wherever the SPA lives
yarn build                  # = next build && node scripts/copy-export.mjs
bench build --app <your-app>
bench restart
```

The layout must end up as:

| File | Location | Served at |
|---|---|---|
| `out/index.html` (+ CSRF snippet) | `<app>/www/portal.html` | `/portal` |
| `out/<page>.html` (+ CSRF snippet) | `<app>/www/portal/<page>.html` | `/portal/<page>` |
| everything else (`_next/`, `.txt` RSC payloads, images) | `<app>/public/portal/` | `/assets/<app>/portal/...` |

Only the HTML in `www/` is Jinja-rendered; that is non-negotiable for the token to resolve.

### Case B — the snippet is there but reads literally `{{ frappe.session.csrf_token }}`

The files are in the right shape but the HTML is **not being rendered through Jinja** — it's being served as a raw static file. Causes: HTML placed under `public/` instead of `www/`, an nginx `location` or `try_files` rule serving the files directly from disk, or a route rule that bypasses Frappe's website renderer.

This is worse than no token: frappe-js-sdk's guard only skips the header when the value equals the literal `"{{ csrf_token }}"`, so with `"{{ frappe.session.csrf_token }}"` it happily sends the garbage string as the header → guaranteed "CSRF Token missing or incorrect".

**Fix:** same as Case A — HTML into `<app>/www/`, let Frappe serve `/portal`, and remove any nginx/static rule that intercepts `/portal` before it reaches Frappe. Then `bench restart` and `bench clear-website-cache`.

### Case C — a real token is injected, but saves still fail

Then the token you're *sending* doesn't match the current session. Two usual suspects:

1. **Stale token after client-side login.** The page was first loaded as Guest (Guest session's token got baked into `window.csrf_token`), then the user logged in via `useFrappeAuth().login(...)` and was routed with `router.replace(...)` — a client-side navigation that **never reloads the HTML**, so the old token sticks. Every subsequent save then fails while login itself worked (login is exempt).

   **Fix:** force a full page load after login so Frappe re-renders the HTML with the logged-in session's token. In `src/app/login/page.tsx`, replace the post-login `router.replace("/dashboard")` with:

   ```ts
   window.location.assign("/portal/dashboard"); // full reload; basePath must be included
   ```

   (Same for logout, in reverse.) Note `router.*` URLs are basePath-relative but `window.location` is not — include `/portal`.

2. **Cached Guest-rendered page.** Frappe caches website pages for guests; a cached copy with a Guest token can be served after login in some setups. Run `bench clear-website-cache` and hard-refresh while testing so you're not chasing a ghost.

Quick check in the prod browser console after logging in: `window.csrf_token` should be a long hex string, and the failing request's `X-Frappe-CSRF-Token` header (Network tab) should equal it. If the header matches the page token but saves still fail, it's the stale-session case (1).

## Robust fallback: fetch the token at runtime

The generated app already ships `src/lib/csrf.ts` (`ensureCsrfToken()`, called from `AppProviders`). It's a no-op when the Jinja token is present, but it can also *fetch* the token — which both papers over serving quirks and fixes the stale-after-login case if you call it again post-login:

```ts
// after successful login, before navigating:
window.csrf_token = undefined;
await ensureCsrfToken();
```

The default method `frappe.sessions.get_csrf_token` may not be whitelisted on your site (403/404). If so, add to your host app:

```python
# <app>/api.py
import frappe

@frappe.whitelist()
def csrf_token():
    return frappe.sessions.get_csrf_token()
```

and set `CSRF_METHOD = "<app>.api.csrf_token"` in `src/lib/csrf.ts`.

## What NOT to do

Do **not** set `ignore_csrf: 1` on the production site to make the error go away — that disables CSRF protection for the whole site (Desk included). It's a dev-proxy convenience only.

## Checklist

1. `yarn build` in the SPA dir → confirms `✓ entry → ../<app>/www/portal.html` from copy-export.mjs.
2. HTML lives in `<app>/www/`, assets in `<app>/public/portal/`; no nginx/static rule shadowing `/portal`.
3. `bench build --app <app>`, `bench restart`, `bench clear-website-cache`.
4. View-source of `/portal` shows a resolved hex token, not the raw Jinja.
5. Login flow does a **full page reload** (or re-runs `ensureCsrfToken()`) so the token belongs to the logged-in session.
6. Save a doc; the request's `X-Frappe-CSRF-Token` header matches `window.csrf_token`.
