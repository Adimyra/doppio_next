# Doppio Next

A Frappe app (in the spirit of [doppio](https://github.com/NagariaHussain/doppio)) that scaffolds a complete, production-ready **Next.js + TypeScript + Tailwind CSS v4 + shadcn/ui** customer portal inside any custom Frappe/ERPNext app — wired to the Frappe backend with **frappe-react-sdk**, cookie auth, realtime (socket.io), and driven end-to-end by **Website Settings** and **Portal Settings**, so site managers control branding, navigation, theming and content from the Desk with no redeploys.

Built by [Adimyra Systems Private Limited](mailto:care@adimyra.com) · ERPNext + Next.js.

## Features

**Everything below ships from a single `bench add-next-spa` command.**

### Driven by Website Settings (no rebuilds)

- **Branding** — app logo / brand image in the navbar, auth pages and footer; favicon set at runtime (falls back to the app logo); app name used across heroes and titles.
- **Navigation** — Top Bar Items render the navbar (with `parent_label` dropdown grouping); Footer Items render grouped footer columns where a parent label is a heading, never a link.
- **Auth visibility** — `hide_login` hides the login/signup buttons, `disable_signup` removes all signup UI (enforced server-side too), `navbar_search` adds a search box (submits to Frappe's `/search`), `show_footer_on_login` shows the footer on auth pages.
- **Footer** — `footer_logo`, `address` (line breaks preserved), `copyright`, `footer_powered`, plus a newsletter form ("Stay in the loop") gated on `hide_footer_signup` that stores subscribers in the **Website** Email Group.

### The "Adi Settings" tab (custom fields created at scaffold time)

- **Default Website Theme** — Light or Dark; the site opens in it, a visitor's own sun/moon toggle choice wins after they change it once.
- **Homepage Design** — switch the homepage between six designs (see below) from the Desk.
- **Homepage Content** — minimal overrides: Title, Tagline, CTA Label, CTA URL; every design uses them.
- **Navbar Style** — Default (theme-aware), Plain (one color) or Gradient (from/to colors) with Light/Dark text.
- **Footer Contact** — email + short text for the footer "Get in touch" column.
- **Brand Colors** — two color pickers (defaults `#112921` deep + `#4D6443` moss). The full palette — buttons, gradients, tints, dark-mode surfaces, both themes — derives from these at runtime. Two colors re-theme the entire site.

### Switchable homepage designs + live demos

Six homepage designs, previewable at `/demos/<key>` with a banner and a **"Use this as homepage"** button (visible to desk users; the API enforces Website Settings write permission):

| Key | Name | Style |
|---|---|---|
| `classic` | Landing | Full marketing landing (hero, services grid linking to the demos, CTA banner) |
| `ecommerce` | Shopfront | Store hero + product showcase |
| `portal` | Portal | Account-first hero with stat cards |
| `personal` | Studio | Minimal personal/portfolio hero |
| `erpnext` | Enterprise | ERP pitch with a metrics panel |
| `custom` | Spark | Bold gradient hero with feature chips |

### Auth, in a split-screen shell

Login, tab-style Sign Up, Forgot password and Reset password share one `AuthShell` (brand gradient panel + form side, responsive):

- **Login** — email/password with show/hide toggle; redirects to My Account.
- **Sign Up** — first/last name, email and **phone with dial-code select**, via a custom `sign_up` API that mirrors Frappe's flow (same `disable_signup` enforcement and return codes) while storing the mobile number.
- **Forgot** (`/login#forgot`) — Frappe's standard reset email.
- **Reset** (`/update-password?key=...`) — Frappe's reset emails land on the SPA page via the hooks redirect.

### My Account (`/my-account`)

- Sidebar navigation (horizontal pills on mobile): Profile + one section per **Portal Settings** menu item the user's roles allow.
- Profile is read-only until **Edit profile** (first/last name, mobile, phone).
- Generic section tables adapt per doctype (title/status/total columns appear only when the doctype has them); rows are scoped to the logged-in user via ERPNext's customer/supplier contact linkage, falling back to `raised_by`/`owner`.
- The Issues section includes a raise-issue form.
- Navbar shows an avatar menu: My Account, **Desk** (`/app`, System Users only), Log out.

### Theming & UX

- Dark/light mode everywhere (next-themes, class strategy) with a navbar toggle.
- Brand-variable palette (`--brand-*`) — all gradients and tokens derive from the two Adi Settings colors.
- Motion animations (`motion/react`): page-enter transition + `FadeIn`, `StaggerContainer`/`StaggerItem`, `HoverLift`, `AnimatedNumber` primitives.
- Fully responsive; equal-height card grids; sticky translucent (or custom-colored) navbar.

### Backend API installed into the host app

`<app>/website_api.py` (guest-safe where appropriate): `get_website_settings`, `get_session_user`, `update_my_profile`, `get_portal_sections`, `get_portal_list`, `raise_issue`, `sign_up` (with mobile), `subscribe` (newsletter), `set_homepage_design`. The SPA works without doppio_next installed on the production site.

### Generator niceties

- **Node auto-resolution** — if the Node on PATH is older than 20.9, the generator finds and uses the newest suitable version under nvm automatically (clear instructions if none exists).
- **shadcn CLI drift handling** — pins the Radix library and the preset non-interactively across CLI majors, and verifies `components.json` actually exists.
- **Bench ports baked in** — the dev proxy and realtime socket use `webserver_port`/`socketio_port` from `common_site_config.json`, not hardcoded 8000/9000.
- **Site setup on scaffold** — sets Website Settings `home_page` to the SPA (only when it's the app's sole SPA), creates all Adi Settings custom fields, and appends `website_redirects` to the host app's hooks.py so Frappe's default `/login`, `/update-password`, `/about` and `/contact` route to the SPA on every site the app is installed on (`redirect-to` is honored by the SPA login).

## Requirements

Works on **Frappe/ERPNext v15 and v16** benches:

- Python 3.10+ (v15 benches typically run 3.10–3.12; v16 runs 3.14)
- Node.js 20.9+ — or just have one installed under nvm; the generator picks it up automatically
- Yarn 1.22+

The generated frontends declare `engines: { node: ">=20.9" }`.

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
# --no-example              skip the sample blog pages
# --serving static          (default) exported + served by Frappe, no Node in prod
# --serving standalone      Node server with full SSR/API routes/server actions
```

What it does:

1. Resolves a Node ≥ 20.9 (PATH or nvm) and runs `create-next-app@latest` (App Router, TypeScript, Tailwind v4, src dir, yarn) inside `apps/<your-app>/<name>`
2. Adds `frappe-react-sdk`, `socket.io-client`, `motion`, `next-themes`
3. Runs `shadcn@latest init` (Radix, non-interactive) + adds button, card, input, label, table, badge, avatar, separator, dropdown-menu, tooltip, skeleton, sonner, sheet
4. Overlays the integration templates and pages:
   - `/` — homepage rendering the design chosen in Adi Settings (classic landing by default)
   - `/demos/{ecommerce,portal,personal,erpnext,custom}` — design previews with the "Use this" switch
   - `/about` — Adimyra Systems showcase page
   - `/contact` — contact page (info cards + mail form)
   - `/login` — split-screen Login / Sign Up tabs + forgot-password mode
   - `/update-password` — reset page targeted by Frappe's reset emails
   - `/my-account` — Portal Settings-driven account area
   - `/blog` + `/blog/post?name=...` — blog over Frappe's `Blog Post` doctype (skipped with `--no-example`)
5. Installs `<app>/website_api.py` into the host app (never overwrites your edits)
6. Patches `package.json` scripts (SPA + app root) so `bench build` works, appends the brand palette to `globals.css`
7. Sets `home_page` on the bench's current site, creates the Adi Settings custom fields, and appends the website_redirects block to the host app's hooks.py

## Naming and multiple frontends

The `--name` is the route: `--name shop` serves at `/shop`, `--name crm` at `/crm`. Names must be lowercase URL-safe (`[a-z][a-z0-9_-]*`), can't equal the app name, and can't shadow reserved Frappe routes (`api`, `app`, `assets`, `files`, `login`, ...) — the generator validates this.

One app can host several frontends side by side:

```bash
bench add-next-spa --app myapp --name shop
bench add-next-spa --app myapp --name crm
```

Each gets its own folder (`apps/myapp/shop`, `apps/myapp/crm`), route (`/shop`, `/crm`), asset path (`/assets/myapp/shop/...`), and `www` entries. The app root `package.json` gets namespaced scripts (`build:shop`, `build:crm`, `dev:crm`, ...); the aggregate `build`/`postinstall` chain all frontends so `bench build --app myapp` builds everything. `yarn dev` runs the most recently added frontend — run `yarn dev:shop` etc. for a specific one (give each a distinct port, e.g. `yarn dev:shop -p 8081`). When multiple SPAs exist, the generator leaves `home_page` untouched so a second scaffold never steals the homepage.

Also make sure no other installed app claims the same route — an old doppio SPA with a `website_route_rules` catch-all for the same name will hijack deep links.

## Development

```bash
cd apps/<your-app>/<name>
yarn dev
# → http://localhost:8080/<name>
```

The dev server proxies `/api`, `/assets`, `/files`, `/private` to the bench web server and connects realtime to the bench's socketio port (both read from `common_site_config.json` at scaffold time).

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

`bench build --app <your-app>` runs the same build through the root `package.json` scripts.

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

Each `id` gets its own HTML in `www/`, so deep links work. Runs at build time on your machine, so it can hit the bench freely (use an API key header if the doctype isn't public). For unbounded/user-generated ids, either switch to query params (`/item?id=X`, always works in static mode) or use standalone mode, where dynamic segments SSR naturally.

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

If `tsc` flags an API drift (e.g. frappe-react-sdk's `login()` signature changed), the fix will be a one-liner in the affected template page.

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
│       ├── _backend/website_api.py   # installed into the host app
│       ├── _variants/                 # brand-theme.css, standalone config
│       └── src/
│           ├── lib/{frappe,auth,socket,csrf,website-settings,use-require-auth}.ts
│           ├── components/{app-providers,theme-provider,site-header,auth-shell,home-designs,motion}.tsx
│           └── app/{layout,page}.tsx, login/, update-password/, my-account/,
│               about/, contact/, demos/, blog/
```

`__APP__` / `__SPA__` / `__WEB_PORT__` / `__SOCKET_PORT__` placeholders in templates are replaced at scaffold time.

## License

MIT
