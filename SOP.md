# SOP — Doppio Next: Adding a Next.js Frontend to a Frappe/ERPNext App

**Scope:** scaffolding, developing, and deploying a Next.js + TypeScript + Tailwind v4 + shadcn/ui frontend on a Frappe bench using `bench add-next-spa`.
**Audience:** developers with bench access.
**Version:** 1.0 (2026-07-05)

---

## 1. Prerequisites

Verify before starting:

| Check | Command | Expected |
|---|---|---|
| Bench + site running | `bench start` | web on :8000, socketio on :9000 |
| Node 24 (LTS) + Yarn 1.22+ (Frappe v16 parity) | `node -v && yarn -v` | v24.x, 1.22+ |
| Python 3.14 (Frappe v16 parity) | `python3 --version` | 3.14.x |
| Host app exists on bench | `ls apps/<your-app>` | app directory present |
| Doppio Next installed | `bench add-next-spa --help` | help text shown |

If the last check fails: `bench get-app <doppio_next repo>` from the bench directory.

## 2. Scaffold

Run from the **bench directory**:

```bash
bench add-next-spa --app <your-app> --name <frontend-name> --serving static
```

Rules for `--name` (it becomes the URL `/<name>`): lowercase letters/digits/`-`/`_`, must start with a letter, must not equal the app name, must not be a reserved route (`api`, `app`, `assets`, `files`, `login`, ...). Examples: `shop`, `crm`, `frontend`.

Flags: `--serving standalone` if you need SSR/API routes (see §7); `--no-example` to skip the sample pages (dashboard, projects, portal, profile, admin).

**Verify:** command ends with "✅ Done!"; `apps/<your-app>/<name>/` exists; then:

```bash
cd apps/<your-app>/<name>
yarn tsc --noEmit        # type-check must pass
```

## 3. Develop

```bash
cd apps/<your-app>/<name>
yarn dev                 # http://localhost:8080/<name>
```

Keep `bench start` running — the dev server proxies `/api`, `/assets`, `/files`, `/private` to :8000; realtime connects to :9000. Log in through the app's `/login` page so session cookies are set. If POSTs fail with CSRF errors in dev, add `"ignore_csrf": 1` to `sites/<site>/site_config.json` (dev only — never production).

## 4. Customize

Follow the app's conventions (full catalog: `docs/admin-panel-spec.md`, skill references in `skill/doppio-next-frontend/`):

1. Pick the shell: public page → `SiteHeader`; logged-in page → `AppHeader` + `useRequireAuth()`; admin section → add under `src/app/admin/`.
2. Fetch with frappe-react-sdk hooks; add `useFrappeEventListener("list_update", ...)` + `mutate()` for realtime.
3. Always render three states: `Skeleton` (loading), friendly hint (error), empty state.
4. Reuse `StatCard`, Badge variants, and motion primitives (`FadeIn`, `StaggerContainer`, `HoverLift`, `AnimatedNumber`).
5. Register the page in the shell's `NAV` array.
6. New shadcn components: `npx shadcn@latest add <name> --yes` — never hand-copy.
7. Dynamic detail pages in static mode: use query params (`/thing?name=X`, `useSearchParams` inside `<Suspense>`) or `generateStaticParams`.
8. Before committing: `yarn tsc --noEmit && yarn build`.

## 5. Build & deploy (static mode)

```bash
cd apps/<your-app>/<name>
yarn build               # next build + copy-export.mjs
```

This places assets in `<app>/public/<name>/` and HTML (with the CSRF snippet) in `<app>/www/`. Then on the server:

```bash
bench build --app <your-app>     # runs all frontend builds via root package.json
bench clear-website-cache
bench restart
```

**Verify:** open `https://<site>/<name>` — page loads, login works, a document save succeeds (proves CSRF token is being injected: view-source should show `window.csrf_token = '...'` with a real value, not a literal `{{ ... }}`).

## 6. Multiple frontends

Repeat §2 with different names (`shop`, `crm`, ...). Each gets its own route and build wiring; `bench build --app <app>` builds all of them. For parallel dev servers use distinct ports: `yarn dev:shop`, and edit the port in the second one (`next dev -p 8081`).

## 7. Standalone mode (only if SSR needed)

Scaffold with `--serving standalone`. Deploy: `yarn build && yarn start` (:3000), add the nginx `location /<name>` block from README.md, keep the process alive via supervisor/pm2. If CSRF fetch 403s, whitelist the 4-line `csrf_token` method documented in `src/lib/csrf.ts`.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| CSRF error only in production | HTML not served through Frappe's Jinja renderer, or copy-export skipped | Rebuild with `yarn build`; check view-source for the token; §5 verify step |
| Blank page / 404 assets in prod | Assets not in `<app>/public/<name>` | Re-run `yarn build`, then `bench build`, `bench restart` |
| 403 on Blog Post / public data | Guest REST access off (Frappe default) | Grant guest read or require login |
| "Could not load Project/Issue" hint | ERPNext not installed on site | Expected degradation — install ERPNext or remove those pages |
| Deep link 404 for dynamic route | Static export limitation | Query-param pattern or `generateStaticParams` (README) |
| Type errors after scaffold | frappe-react-sdk API drift | Usually one-line fix in `login/page.tsx` or `app-providers.tsx` |
| Generator refuses the name | Reserved/invalid name | Pick lowercase, non-reserved name (§2) |
| Realtime not updating | socketio not on :9000 / `enableSocket` off | Check `bench start` output and `AppProviders` props |

## 9. Do / Don't

**Do:** keep writes small (toggle-style) in the frontend and complex operations in the Desk; run the §4.8 checks before every merge; treat server-side permissions as the only real access control.
**Don't:** set `ignore_csrf` in production; hardcode hex colors (use tokens); name a frontend after the app or a reserved route; edit `www/`/`public/` build output by hand (it's regenerated every build).
