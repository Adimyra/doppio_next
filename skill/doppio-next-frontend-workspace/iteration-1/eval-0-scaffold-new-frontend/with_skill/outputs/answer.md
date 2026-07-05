# Adding a Next.js + shadcn frontend to `inventory_hub` (Doppio Next, static mode)

Since this is an internal stock dashboard with no SSR requirement, use **static export mode** (the default). Frappe serves everything — no Node process to keep alive in production, no extra nginx or supervisor config. This matches doppio's proven model and removes an entire process from your ops.

## 1. One-time setup: install the Doppio Next CLI on your bench

```bash
cd ~/frappe-bench   # your bench directory
bench get-app <doppio_next repo URL>
```

This installs the `doppio_next` Frappe app, which registers the `bench add-next-spa` command. You only do this once per bench — it does not need to be installed on any site.

## 2. Scaffold the frontend inside inventory_hub

```bash
bench add-next-spa --app inventory_hub --name frontend
```

Notes on the flags:

- `--name frontend` — the SPA directory name **and** the URL prefix your dashboard will be served at (`/frontend`). Pick something meaningful if you prefer, e.g. `--name stock` → served at `/stock`. **Do not name it `inventory_hub`** — the generator refuses a SPA named the same as the host app.
- `--serving static` is the default, so you can omit it. (The alternative, `standalone`, runs `next start` on :3000 behind nginx — only needed for SSR, which you don't want.)
- `--no-example` — optional. Strips the example app pages (dashboard, projects, portal, admin, blog) but keeps the login page, all the libs (auth, CSRF, socket), and public pages. For a stock dashboard I'd actually **keep the examples** initially: `/dashboard` and `/admin` demonstrate exactly the patterns you'll reuse (StatCard grids, doclist tables, realtime updates), and you can delete them once your own pages exist.

### What gets generated

The stack: **Next.js App Router** (`create-next-app@latest`, `src/` dir, Turbopack), **TypeScript**, **Tailwind CSS v4** (+ `@tailwindcss/typography`), **shadcn/ui** (13 components preinstalled: button, card, input, label, table, badge, avatar, separator, dropdown-menu, tooltip, skeleton, sonner, sheet), **Motion** (`motion/react`), **frappe-react-sdk**, and **socket.io-client** for realtime.

Resulting structure:

```
apps/inventory_hub/
├── inventory_hub/            # your Python app (unchanged)
├── package.json              # PATCHED by the generator:
│                             #   postinstall → cd frontend && yarn install
│                             #   dev/build   → delegate into frontend/
│                             # (this is what makes `bench build --app inventory_hub` work)
├── frontend/                 # the new Next.js app
│   ├── next.config.ts        # dev: rewrites /api,/assets,/files,/private → :8000
│   │                         # prod: output:"export", basePath:"/frontend",
│   │                         #       assetPrefix:"/assets/inventory_hub/frontend"
│   ├── scripts/copy-export.mjs   # post-build: copies out/ into public/ + www/
│   ├── package.json          # dev: next dev -p 8080; build: next build && copy-export
│   └── src/
│       ├── app/              # App Router routes (/, /login, /dashboard, /admin, ...)
│       │   └── template.tsx  # global page-enter transitions
│       ├── components/       # site-header, app-header, motion.tsx, StatCard, ui/ (shadcn)
│       └── lib/              # frappe.ts (typed frappeCall), auth.ts (cookie helpers),
│                             # socket.ts (realtime), csrf.ts
├── inventory_hub/public/frontend/   # (after prod build) JS/CSS/assets
└── inventory_hub/www/                # (after prod build) frontend.html + frontend/<page>.html
```

### Post-scaffold sanity check

```bash
cd apps/inventory_hub/frontend
yarn tsc --noEmit
```

The templates track frappe-react-sdk's current API; if there's drift it's usually a one-line fix in `login/page.tsx` or `app-providers.tsx`.

## 3. Dev workflow

Two terminals:

```bash
# Terminal 1 — the bench (backend on :8000, socketio on :9000)
bench start

# Terminal 2 — the Next dev server
cd apps/inventory_hub/frontend
yarn dev          # → http://localhost:8080/frontend
```

How dev wiring works (useful when something 401s or shows blank data):

- **API proxy**: `next.config.ts` rewrites `/api`, `/assets`, `/files`, `/private` to `http://127.0.0.1:8000` (with `basePath: false` so rewrites escape the SPA basePath). All data flows through `/api/method/*` and `/api/resource/*` on the same origin — cookies just work.
- **Auth**: cookie sessions. The `user_id` cookie is the check (`Guest` or absent = logged out). Log in through the app's `/login` page so the session cookies are set.
- **CSRF**: POSTs need `X-Frappe-CSRF-Token`. In dev, either log in through the app, or set `"ignore_csrf": 1` in `sites/<site>/site_config.json` while developing.
- **Realtime**: does not go through the proxy — `src/lib/socket.ts` connects directly to `:9000` in dev, same-origin `/socket.io` in prod.

## 4. Building your stock dashboard pages

Follow the generated conventions rather than inventing parallel ones:

1. **Shell**: an internal dashboard is authenticated → use the `AppHeader` shell with `useRequireAuth()` (redirects to `/login`). Add your routes under `src/app/` (e.g. `src/app/stock/page.tsx`) and add nav entries to `AppHeader`'s `NAV` array — don't build a parallel nav.
2. **Data**: frappe-react-sdk hooks against your doctypes:

   ```tsx
   "use client";
   const { data, isLoading, error, mutate } = useFrappeGetDocList<StockItem>(
     "Stock Ledger Entry",   // or your custom doctypes
     { fields: ["item_code", "warehouse", "actual_qty", "posting_date"],
       orderBy: { field: "posting_date", order: "desc" }, limit: 20 }
   );
   useFrappeEventListener("list_update", (d) => {
     if (d?.doctype === "Stock Ledger Entry") mutate();   // live-updating dashboard
   });
   ```

   Defer user-dependent fetches with a `null` SWR key until `currentUser` is known.
3. **Three states, always**: `Skeleton` rows while loading, a friendly hint on error (say why — e.g. permissions), an empty-state table row when there's no data.
4. **UI**: reuse the shared `StatCard` for metrics (total SKUs, low-stock count, etc.), shadcn `Table`/`Badge`/`Card`, and the motion primitives from `src/components/motion.tsx` (`FadeIn`, `StaggerContainer`/`StaggerItem`, `HoverLift`, `AnimatedNumber`). Page-enter transitions come free from `src/app/template.tsx`.
5. **Tokens only**: `bg-muted`, `text-muted-foreground`, badge variants — no hardcoded hex, and dark mode survives for free.
6. **More shadcn components** (charts, dialogs, selects...):

   ```bash
   npx shadcn@latest add dialog select chart --yes
   ```

   Don't hand-copy component code.
7. **Item detail pages** in static mode: dynamic segments can't SSR. Use the query-param pattern — one exported page like `/items/detail?name=<item_code>`, read it with `useSearchParams` inside a `<Suspense>` boundary, fetch client-side. New items need no rebuild. (Alternative: `generateStaticParams` to pre-render each id at build time, but for inventory that changes constantly, query params are the right call.)

## 5. Production workflow

```bash
cd apps/inventory_hub/frontend
yarn build
```

This runs `next build` (static export) then `scripts/copy-export.mjs`, which distributes `out/`:

| From (`out/`) | To | Served at |
|---|---|---|
| non-HTML (`_next/`, RSC `.txt` payloads) | `inventory_hub/public/frontend/` | `/assets/inventory_hub/frontend/...` |
| `index.html` (+ CSRF snippet) | `inventory_hub/www/frontend.html` | `/frontend` |
| `<page>.html` (+ CSRF snippet) | `inventory_hub/www/frontend/<page>.html` | `/frontend/<page>` |

The CSRF snippet is `<script>window.csrf_token = '{{ frappe.session.csrf_token }}';</script>` — Frappe renders `www/*.html` through Jinja, so the token resolves per request and authenticated POSTs work with zero runtime plumbing.

Because the generator patched `apps/inventory_hub/package.json`, standard bench workflows also work:

```bash
bench build --app inventory_hub    # builds the frontend too
bench setup requirements           # postinstall → yarn install in frontend/
```

Deploy is just your normal app deploy: pull, `bench build --app inventory_hub`, done. Users visit `https://your-site/frontend`. No Node process, no nginx changes, no supervisor entry.

## 6. Gotchas to know upfront

- **Never name the SPA the same as the app** — the generator refuses.
- **Guest REST access is off by default** — fine for you (internal, authenticated), but the example blog page will show its permission hint until guest read is granted.
- **ERPNext-only doctypes**: the example `/projects` and `/portal` pages use Project/Issue; on a Frappe-only site they render their "missing ERPNext" hint — expected, not a bug.
- **Jinja collision**: stray `{{` / `{%` in exported HTML can break `www` rendering (rare; escape in `copy-export.mjs` if hit).
- **Client-side navigation** may occasionally fall back to full-page loads in static mode when RSC payload files aren't reachable — cosmetic only.
- **No SSR/ISR/API routes/server actions** in static mode. If you ever need them (you said you don't), rescaffold or switch to `--serving standalone` (`next start -p 3000` behind an nginx `location /frontend` block, plus a runtime CSRF fetch via `src/lib/csrf.ts`).

## TL;DR command sequence

```bash
cd ~/frappe-bench
bench get-app <doppio_next repo>
bench add-next-spa --app inventory_hub --name frontend        # static is default
cd apps/inventory_hub/frontend
yarn tsc --noEmit                                             # sanity check
yarn dev                                                      # develop at :8080/frontend (bench on :8000)
yarn build                                                    # ship: exports into public/ + www/
```
