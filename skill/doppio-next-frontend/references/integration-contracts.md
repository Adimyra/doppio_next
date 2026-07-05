# Next ↔ Frappe integration contracts (deep dive)

## 1. Dev proxy

`next.config.ts` (dev branch) rewrites to the bench web server:

```ts
async rewrites() {
  const frappe = "http://127.0.0.1:8000";
  return ["api", "assets", "files", "private"].map((p) => ({
    source: `/${p}/:path*`,
    destination: `${frappe}/${p}/:path*`,
    basePath: false as const,   // rewrites must escape the SPA basePath
  }));
}
```

Dev server runs on `:8080` (`next dev -p 8080`). Realtime does NOT go through
the proxy — `src/lib/socket.ts` connects directly to `:9000` when a port is
present in `window.location` (dev), same-origin `/socket.io` otherwise (prod
nginx). `FrappeProvider` gets `socketPort="9000"`.

CSRF in dev: log in through the app so cookies carry the session, or set
`ignore_csrf: 1` in site config while developing.

## 2. Auth + CSRF

- Session = cookies set by Frappe on `login`. `user_id` cookie is the check:
  absent or `"Guest"` → logged out. `src/lib/auth.ts` has cookie helpers;
  components use `useFrappeAuth()` (login takes `{ username, password }`).
- Every POST to `/api/method/*` needs `X-Frappe-CSRF-Token`. frappe-js-sdk /
  frappe-react-sdk pick it up from `window.csrf_token` automatically; the
  typed `frappeCall` in `src/lib/frappe.ts` does the same.
- **Static mode**: `copy-export.mjs` injects
  `<script>window.csrf_token = '{{ frappe.session.csrf_token }}';</script>`
  into every HTML entry; Frappe renders `www/*.html` through Jinja so the
  token resolves per request.
- **Standalone mode**: Next serves the HTML, so `src/lib/csrf.ts` fetches the
  token on mount (no-op when already present). Default method
  `frappe.sessions.get_csrf_token` may not be whitelisted; the documented
  fallback is a 4-line whitelisted method in the host app:

  ```python
  # <app>/api.py
  import frappe

  @frappe.whitelist()
  def csrf_token():
      return frappe.sessions.get_csrf_token()
  ```

  then set `CSRF_METHOD = "<app>.api.csrf_token"` in `csrf.ts`.

## 3. Static export pipeline

Prod config: `output: "export"`, `basePath: "/<spa>"`,
`assetPrefix: "/assets/<app>/<spa>"`, `images: { unoptimized: true }`.

`yarn build` = `next build && node scripts/copy-export.mjs`, which:

| From (out/) | To | Served at |
|---|---|---|
| non-HTML (incl. `_next/`, `.txt` RSC payloads) | `<app>/public/<spa>/` | `/assets/<app>/<spa>/...` |
| `index.html` (+ CSRF snippet) | `<app>/www/<spa>.html` | `/<spa>` |
| `<page>.html` (+ CSRF snippet) | `<app>/www/<spa>/<page>.html` | `/<spa>/<page>` |

No `website_route_rules` catch-all is added (unlike original doppio): per-page
HTML gives correct deep links for exported routes, and a catch-all would
shadow them. Jinja caveat: `{{` / `{%` sequences inside exported HTML can
break `www` rendering — escape/strip in copy-export.mjs if it ever happens.

## 4. Deep links for dynamic routes (static mode)

Options, in order of preference:

1. **Query params** — `/blog/post?name=<docname>` pattern: one exported page,
   `useSearchParams` inside a `<Suspense>` boundary, client fetch by param.
   New documents need no rebuild.
2. **`generateStaticParams`** — pre-render each id at build time by fetching
   `/api/resource/<Doctype>?limit_page_length=0` from `FRAPPE_URL`
   (build runs on the bench machine, so `:8000` is reachable; use an API key
   header for non-public doctypes). `params` is a Promise in Next 15+.
3. **Standalone mode** — dynamic segments SSR naturally.

## 5. Standalone deployment

`output: "standalone"`, scripts `build: next build`, `start: next start -p 3000`.
nginx (before default Frappe locations):

```nginx
location /<spa> {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
# /api, /assets, /files, /socket.io stay on Frappe
```

Keep the process alive via bench supervisor entry or pm2. Same-domain =
cookies work unchanged. Server-side fetches: use `process.env.FRAPPE_URL` and
forward incoming cookies.

## 6. bench build integration

The generator patches the host app's root `package.json`:
`postinstall` → `cd <spa> && yarn install`, `dev`/`build` → delegate into the
SPA. This is what makes `bench build --app <app>` (and `bench setup
requirements`) pick the frontend up. The SPA's own `package.json` gets
`dev: next dev -p 8080` and the mode-appropriate `build`.
