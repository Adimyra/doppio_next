# Doppio Next

A Frappe app (in the spirit of [doppio](https://github.com/NagariaHussain/doppio)) that scaffolds a **Next.js + TypeScript + Tailwind CSS v4 + shadcn/ui** frontend inside any custom Frappe/ERPNext app — wired to the Frappe backend with **frappe-react-sdk**, a typed API client, cookie auth, and realtime (socket.io).

## Requirements

Toolchain parity with **Frappe/ERPNext v16**: Python 3.14, Node.js 24 (LTS), Yarn 1.22+, MariaDB 11.8, pip 25.3+. The generated frontends declare `engines: { node: ">=24" }`. (For a v15 bench, relax `requires-python` in pyproject.toml to `>=3.10` and the frappe dependency pin — the code itself is 3.10-compatible.)

## Run on Docker

A ready-made Frappe v16 dev bench (MariaDB 11.8 + Redis 7 + Node 24) lives in `docker/`:

```bash
cd docker && docker compose up -d
docker compose exec frappe bash /workspace/doppio_next/docker/init-bench.sh
docker compose exec frappe bash -lc "cd frappe-bench && bench start"
```

Desk at http://localhost:8000, Next dev servers at http://localhost:8080. Full instructions: `docker/README.md`.

## Installation

```bash
cd $BENCH_DIR
bench get-app <this-repo-url>   # or copy this folder into apps/ and `bench setup requirements`
```

## Usage

```bash
bench add-next-spa --app <your-app> --name frontend
# --no-example              skip the sample dashboard
# --serving static          (default) exported + served by Frappe, no Node in prod
# --serving standalone      Node server with full SSR/API routes/server actions
```

What it does:

1. Runs `create-next-app@latest` (App Router, TypeScript, Tailwind v4, src dir, yarn) inside `apps/<your-app>/<name>`
2. Adds `frappe-react-sdk` and `socket.io-client`
3. Runs `shadcn@latest init` + adds button, card, input, label, table, badge, avatar, separator, dropdown-menu, tooltip, skeleton, sonner
4. Overlays integration templates: `next.config.ts` (dev proxy + static export), `src/lib/frappe.ts` (typed `frappeCall`), `src/lib/auth.ts`, `src/lib/socket.ts`, `src/lib/csrf.ts`, `AppProviders` (FrappeProvider), a shadcn login page, and example pages (all behind a shared `AppHeader` nav + auth guard):
   - `/dashboard` — doc counts + ToDo table with realtime refresh
   - `/projects` — project monitoring over the ERPNext `Project` doctype (status, priority, progress bars, overdue detection, realtime)
   - `/portal` — "my stuff" for the logged-in user: support Issues they raised + open ToDos allocated to them
   - `/profile` — view + edit the logged-in User document (`useFrappeUpdateDoc`)
   - `/admin` — admin panel with its own sidebar layout (`AdminShell`: fixed sidebar on desktop, Sheet drawer on mobile): overview stats + Activity Log, user management (search, enable/disable with protected Administrator/Guest rows), and Error Log viewer. Access is gated by a REST permission probe — Frappe's server-side permissions are the real gate, non-admins see an "Access denied" card. Design spec: `docs/admin-panel-spec.md`.

   Pages that use ERPNext doctypes (`Project`, `Issue`) degrade to a friendly hint on Frappe-only sites.

   Animations are powered by **Motion** (Framer Motion's successor, `motion/react`): a global page-enter transition (`src/app/template.tsx`) plus reusable primitives in `src/components/motion.tsx` — `FadeIn`, `StaggerContainer`/`StaggerItem`, `HoverLift`, and `AnimatedNumber` (spring count-up used by the stat cards). The landing hero/feature grid, login card, and dashboard/projects stats all use them; compose the same primitives in your own pages.

   Plus public website pages (no login required, shared `SiteHeader`/`SiteFooter`):
   - `/` — landing page with hero and feature cards
   - `/about` — about-us page (static route, replace the placeholder copy)
   - `/blog` + `/blog/post?name=...` — blog list and detail over Frappe's built-in `Blog Post` doctype; detail uses a query param so new posts need no rebuild in static mode (`@tailwindcss/typography` is installed for rendered post HTML). Guest REST access to Blog Post must be granted for a public blog; otherwise it shows a hint.
5. Patches `package.json` scripts (SPA + app root) so `bench build` works
6. `scripts/copy-export.mjs` handles production export into your app

## Naming and multiple frontends

The `--name` is the route: `--name shop` serves at `/shop`, `--name crm` at `/crm`. Names must be lowercase URL-safe (`[a-z][a-z0-9_-]*`), can't equal the app name, and can't shadow reserved Frappe routes (`api`, `app`, `assets`, `files`, `login`, ...) — the generator validates this.

One app can host several frontends side by side:

```bash
bench add-next-spa --app myapp --name shop
bench add-next-spa --app myapp --name crm
```

Each gets its own folder (`apps/myapp/shop`, `apps/myapp/crm`), route (`/shop`, `/crm`), asset path (`/assets/myapp/shop/...`), and `www` entries. The app root `package.json` gets namespaced scripts (`build:shop`, `build:crm`, `dev:crm`, ...); the aggregate `build`/`postinstall` chain all frontends so `bench build --app myapp` builds everything. `yarn dev` runs the most recently added frontend — run `yarn dev:shop` etc. for a specific one (give each a distinct port, e.g. `yarn dev:shop -p 8081`).

## Development

```bash
cd apps/<your-app>/<name>
yarn dev
# → http://localhost:8080/<name>
```

The dev server proxies `/api`, `/assets`, `/files`, `/private` to the bench server on `:8000`. Realtime connects directly to `:9000`.

CSRF in dev: either log in through the app (cookies carry the session) or set `allow_cors` / `ignore_csrf: 1` in your site config while developing.

## Production build

```bash
cd apps/<your-app>/<name>
yarn build
```

This runs `next build` (static export with `basePath: /<name>` and `assetPrefix: /assets/<app>/<name>`) and then copies:

- static assets → `<app>/public/<name>/` (served at `/assets/<app>/<name>/`)
- `index.html` → `<app>/www/<name>.html` (served at `/<name>`)
- other pages → `<app>/www/<name>/<page>.html` (served at `/<name>/<page>`)

A `window.csrf_token = '{{ frappe.session.csrf_token }}'` snippet is injected into every HTML entry; Frappe renders `www/*.html` through Jinja, so the token resolves per request and frappe-react-sdk picks it up automatically.

## Constraints of static export — and how to fix each one

**No SSR / API routes / server actions** → use `--serving standalone`. The app builds with `output: "standalone"` and runs `next start -p 3000` behind nginx. Add to your site's nginx config (before the default Frappe locations):

```nginx
location /frontend {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
# /api, /assets, /files, /socket.io keep going to Frappe as usual
```

Keep the Node process alive with the bench supervisor (add a program entry) or pm2. Because Next and Frappe share the same domain, session cookies just work; the CSRF token is fetched at runtime by `src/lib/csrf.ts` (if your site 403s on `frappe.sessions.get_csrf_token`, whitelist the 4-line method shown in that file's docstring).

**Dynamic route deep links (`/items/[id]`) in static mode** → pre-render the params at build time:

```tsx
// src/app/items/[id]/page.tsx
export async function generateStaticParams() {
  const res = await fetch(
    `${process.env.FRAPPE_URL ?? "http://127.0.0.1:8000"}/api/resource/Item?limit_page_length=0`,
    { headers: { Accept: "application/json" } }
  );
  const { data } = await res.json();
  return data.map((d: { name: string }) => ({ id: d.name }));
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemClient id={id} />; // client component fetches live data via frappe-react-sdk
}
```

Each `id` gets its own HTML in `www/`, so deep links work. Runs at build time on your machine, so it can hit `:8000` freely (use an API key header if the doctype isn't public). For unbounded/user-generated ids, either switch to query params (`/item?id=X`, always works in static mode) or use standalone mode, where dynamic segments SSR naturally.

**Other static-mode notes**

- Client-side navigation may fall back to full-page navigation when RSC payload files aren't served; cosmetic, not functional.
- Rare edge case: if an exported HTML file contains `{{` or `{%` sequences (e.g. in inlined data), Jinja rendering of `www/*.html` could break — escape or strip them in `copy-export.mjs` if you hit this.

## Verifying the templates compile

The TSX templates reference packages installed at scaffold time (`frappe-react-sdk`, shadcn components), so they can only be type-checked inside a scaffolded app. After running `bench add-next-spa`:

```bash
cd apps/<your-app>/<name>
yarn tsc --noEmit   # type-check everything
yarn build          # full production build
```

If `tsc` flags an API drift (e.g. frappe-react-sdk's `login()` signature changed), the fix will be a one-liner in `src/app/login/page.tsx` or `src/components/app-providers.tsx`.

## Structure

```
doppio_next/
├── pyproject.toml               # Click ~8.2, flit build
├── doppio_next/
│   ├── hooks.py                 # Frappe app metadata
│   ├── commands/
│   │   ├── __init__.py          # `bench add-next-spa`
│   │   └── next_generator.py    # NextSPAGenerator pipeline
│   └── templates_next/          # files overlaid onto the scaffolded app
│       ├── next.config.ts
│       ├── scripts/copy-export.mjs
│       └── src/
│           ├── lib/{frappe,auth,socket}.ts
│           ├── components/app-providers.tsx
│           └── app/{layout,page}.tsx, login/, dashboard/
```

`__APP__` / `__SPA__` placeholders in templates are replaced at scaffold time.

## License

MIT
# doppio_next
