# Adding a Next.js + TypeScript + shadcn/ui frontend to `inventory_hub`

Since you don't need SSR, we'll use **Next.js static export** (`output: 'export'`). The app compiles to plain HTML/JS/CSS, which Frappe then serves like any other static asset — no Node server in production, no extra process to manage. Frappe stays your backend (REST API + auth + permissions), Next.js is purely the client.

> **A note on Doppio:** the Doppio bench extension (`bench get-app https://github.com/NagariaHussain/doppio` → `bench add-spa`) is the usual way to bolt a SPA onto a Frappe app, but its stock generators target **Vite** (Vue/React). For Next.js you wire it up manually — it's about 20 minutes of setup and follows the exact same serving pattern Doppio uses (assets in the app's `public/`, HTML entry in `www/`, a catch-all website route rule). That's what this guide does.

---

## 0. Prerequisites

- A working bench with your site (e.g. `stock.localhost`) and `inventory_hub` installed.
- Node.js ≥ 18.18 (Next 14/15 requirement) and npm/yarn/pnpm on the bench machine.

```bash
cd ~/frappe-bench/apps/inventory_hub
```

---

## 1. Scaffold the Next.js app inside your Frappe app

Keep the frontend as a sibling of the Python package, inside the app repo, so it's versioned together:

```bash
cd ~/frappe-bench/apps/inventory_hub
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Resulting top level:

```
apps/inventory_hub/
├── inventory_hub/          # Python package (hooks.py, api/, public/, www/ ...)
├── frontend/               # ← Next.js app lives here
├── pyproject.toml
└── ...
```

---

## 2. Configure Next.js for static export under Frappe

Frappe serves two kinds of things for an app:

- **`inventory_hub/public/`** → served at `/assets/inventory_hub/...` (static files, aggressively cacheable)
- **`inventory_hub/www/`** → server-rendered `.html` entry points (Jinja-processed)

So the plan: JS/CSS/chunks go to `public/frontend/`, the exported `index.html` becomes `www/frontend.html`, and a route rule makes `/frontend/*` always resolve to it (client-side routing).

Edit `frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",                                  // static export, no Node server
  distDir: "dist",                                   // optional; keeps 'out' name free
  basePath: "/frontend",                             // app is mounted at /frontend
  assetPrefix: "/assets/inventory_hub/frontend",     // where Frappe serves _next/*
  images: { unoptimized: true },                     // required for export
  trailingSlash: false,

  // Dev-only proxy: forwards API/asset calls to the Frappe server so the
  // session cookie stays same-origin. Rewrites are ignored by `next build`
  // when output:'export', but `next dev` honours them — which is exactly
  // what we want.
  async rewrites() {
    return [
      { source: "/api/:path*",    destination: "http://localhost:8000/api/:path*" },
      { source: "/app/:path*",    destination: "http://localhost:8000/app/:path*" },
      { source: "/assets/:path*", destination: "http://localhost:8000/assets/:path*" },
      { source: "/files/:path*",  destination: "http://localhost:8000/files/:path*" },
      { source: "/login",         destination: "http://localhost:8000/login" },
    ];
  },
};

export default nextConfig;
```

Notes:

- **`basePath: "/frontend"`** means every page URL is `/frontend/...` in both dev and prod, so links behave identically.
- If your Frappe dev server runs on another port (check `bench start` output / `webserver_port` in `common_site_config.json`), adjust the rewrite destinations.
- With multi-tenant benches without DNS multitenancy, add `Host` handling or use `http://stock.localhost:8000`.

---

## 3. Add shadcn/ui

```bash
cd ~/frappe-bench/apps/inventory_hub/frontend
npx shadcn@latest init
```

Pick the defaults (New York / Zinc / CSS variables — whatever you like). Then pull in what a stock dashboard needs:

```bash
npx shadcn@latest add button card table badge input select \
  dialog dropdown-menu tabs skeleton sonner chart
```

Components land in `frontend/components/ui/` as source you own — edit freely. Since this is a static export there are zero SSR caveats; everything runs as client components. You'll mostly write `"use client"` pages anyway because the dashboard is data-driven.

---

## 4. Talking to Frappe: `frappe-react-sdk`

Don't hand-roll fetch wrappers — use the maintained SDK:

```bash
npm install frappe-react-sdk
```

Wrap the app (`frontend/app/providers.tsx`):

```tsx
"use client";
import { FrappeProvider } from "frappe-react-sdk";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FrappeProvider
      // same-origin in prod; the dev rewrites make it same-origin in dev too
      url=""
      enableSocket={false}
    >
      {children}
    </FrappeProvider>
  );
}
```

Use it in `app/layout.tsx`, then in pages:

```tsx
"use client";
import { useFrappeGetDocList } from "frappe-react-sdk";

export default function StockPage() {
  const { data, isLoading } = useFrappeGetDocList("Bin", {
    fields: ["item_code", "warehouse", "actual_qty", "projected_qty"],
    limit: 100,
    orderBy: { field: "modified", order: "desc" },
  });
  // ...render with shadcn <Table> / <Card>
}
```

For custom aggregations, add whitelisted methods in `inventory_hub/api.py`:

```python
import frappe

@frappe.whitelist()
def stock_summary():
    return frappe.db.sql("""select warehouse, sum(actual_qty) qty
                            from `tabBin` group by warehouse""", as_dict=True)
```

…and call them with `useFrappeGetCall("inventory_hub.api.stock_summary")`.

**Auth & CSRF:**
- **Sessions:** users log in at Frappe's `/login`; because everything is same-origin (rewrites in dev, same host in prod), the `sid` cookie just works. No token juggling for an internal tool.
- **CSRF:** POST calls need `X-Frappe-CSRF-Token`. In **dev**, easiest is to add `"ignore_csrf": 1` to `sites/stock.localhost/site_config.json` (dev only!). In **prod**, inject it via the Jinja-rendered entry HTML — see the build script below, which turns `www/frontend.html` into a template that sets `window.csrf_token = '{{ frappe.session.csrf_token }}'`. `frappe-react-sdk` picks up `window.csrf_token` automatically.
- **Access control:** gate the page for guests by redirecting to `/login?redirect-to=/frontend` when the SDK returns a 403/`Guest` user, or set `no_cache`/guest checks in the www context.

---

## 5. Production build pipeline

### 5.1 Build script

Add to `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build && npm run postbuild",
    "postbuild": "bash ./deploy.sh"
  }
}
```

`frontend/deploy.sh`:

```bash
#!/usr/bin/env bash
set -e
APP_DIR="../inventory_hub"          # python package dir
OUT="dist"                           # next export output (distDir)

# 1. Clean previous build
rm -rf "$APP_DIR/public/frontend"
mkdir -p "$APP_DIR/public/frontend" "$APP_DIR/www"

# 2. Static assets → served at /assets/inventory_hub/frontend/
cp -r "$OUT/_next" "$APP_DIR/public/frontend/_next"
# copy any other static files (favicons, images) except html:
find "$OUT" -maxdepth 1 -type f ! -name "*.html" -exec cp {} "$APP_DIR/public/frontend/" \;

# 3. Entry HTML → www/frontend.html (Jinja template)
cp "$OUT/index.html" "$APP_DIR/www/frontend.html"

# 4. Inject CSRF token for authenticated POSTs (Jinja runs on this file)
sed -i 's|</head>|<script>window.csrf_token = "{{ frappe.session.csrf_token }}";</script></head>|' \
  "$APP_DIR/www/frontend.html"

echo "Frontend deployed into inventory_hub app."
```

> Why the split? Files in `www/` are rendered through Frappe's website renderer (Jinja works, sessions available), while hashed JS/CSS chunks belong in `public/` where nginx serves them directly with long cache headers. `assetPrefix` in step 2 is what makes the exported HTML reference `/assets/inventory_hub/frontend/_next/...`.

> **Jinja vs Next output:** Next's exported HTML can occasionally contain `{{` sequences (e.g. in inlined JSON). If Jinja rendering ever chokes, wrap the body in `{% raw %} ... {% endraw %}` in the sed step, or strip conflicts — for a typical dashboard this rarely comes up, but it's the one gotcha to know about.

### 5.2 Route rule for client-side routing

In `inventory_hub/hooks.py`:

```python
website_route_rules = [
    {"from_route": "/frontend/<path:app_path>", "to_route": "frontend"},
]
```

Now `/frontend`, `/frontend/items`, `/frontend/warehouses/xyz` all serve `frontend.html`, and the Next.js client router takes over. (If you use multiple exported pages instead of a pure SPA router, copy each `*.html` into `www/frontend/` accordingly — for a dashboard, the single-entry SPA pattern is simpler.)

---

## 6. Day-to-day workflows

### Development (hot reload)

Two terminals:

```bash
# Terminal 1 — Frappe backend
cd ~/frappe-bench && bench start          # serves on :8000

# Terminal 2 — Next.js dev server
cd ~/frappe-bench/apps/inventory_hub/frontend
npm run dev                               # serves on :3000
```

- Open **http://localhost:3000/frontend** → full HMR, Tailwind, shadcn.
- Log in once at http://localhost:8000 (or hit `/login` through the proxy) — the session cookie is shared because the rewrites keep everything on `localhost:3000`.
- Backend changes: normal Frappe dev loop (`bench --site stock.localhost migrate`, etc.).

### Production / deploy

```bash
cd ~/frappe-bench/apps/inventory_hub/frontend
npm ci
npm run build                # next build + copy into public/ and www/

cd ~/frappe-bench
bench --site stock.localhost clear-website-cache
bench --site stock.localhost clear-cache
bench restart                # (production benches; not needed in dev)
```

Then open **https://your-site/frontend**. No Node process runs in production — nginx serves the hashed assets, gunicorn serves `frontend.html` through the website renderer with the user's session and CSRF token baked in.

Add the `npm run build` step to your CI or a custom `bench` deploy script so every `bench update`/release rebuilds the frontend. Commit `frontend/` source to the app repo; git-ignore `frontend/dist`, `frontend/node_modules`, and the generated `inventory_hub/public/frontend/` + `inventory_hub/www/frontend.html` (or commit the built output if your servers don't have Node — both are valid strategies, just pick one).

---

## 7. Final structure

```
apps/inventory_hub/
├── frontend/                        # Next.js source (committed)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── providers.tsx            # FrappeProvider
│   │   └── page.tsx                 # dashboard
│   ├── components/ui/               # shadcn components
│   ├── lib/utils.ts
│   ├── next.config.ts               # export + basePath + assetPrefix + dev rewrites
│   ├── deploy.sh
│   └── package.json
├── inventory_hub/
│   ├── hooks.py                     # website_route_rules for /frontend/*
│   ├── api.py                       # whitelisted endpoints
│   ├── public/frontend/             # BUILT assets → /assets/inventory_hub/frontend/*
│   └── www/frontend.html            # BUILT entry (Jinja: injects csrf_token)
└── pyproject.toml
```

### Quick recap of the moving parts

| Concern | Dev | Prod |
|---|---|---|
| Frontend served by | `next dev` on :3000 | Frappe (`www/frontend.html` + `/assets/...`) |
| API calls | proxied via Next rewrites → :8000 | same origin, direct |
| Auth | shared `sid` cookie through proxy | shared `sid` cookie |
| CSRF | `ignore_csrf: 1` in site_config (dev only) | Jinja-injected `window.csrf_token` |
| Routing `/frontend/*` | Next router | `website_route_rules` catch-all → SPA router |

That's the whole system: Vite-less, SSR-less, one static bundle inside your Frappe app, and Frappe doing what it's good at — data, auth, and permissions.
