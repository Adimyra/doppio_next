---
name: doppio-next-frontend
description: >-
  Scaffold, wire, and extend modern Next.js frontends for Frappe/ERPNext apps
  using the Doppio Next pattern (bench add-next-spa: Next.js App Router +
  TypeScript + Tailwind CSS v4 + shadcn/ui + Motion + frappe-react-sdk). Use
  this skill whenever the user mentions Frappe or ERPNext together with a
  frontend, SPA, portal, dashboard, Next.js, React, or "doppio" — including
  adding pages to an existing Doppio Next app, choosing between static-export
  and standalone serving, fixing CSRF/auth/realtime wiring between Next and
  Frappe, deploying a Next frontend behind a bench, or porting a Vite/Vue
  doppio setup to Next.js. Even if the user only says "add a page to my
  frontend" in a Frappe context, use this skill.
---

# Doppio Next: Next.js frontends for Frappe/ERPNext

Doppio Next is a Frappe app (Python/Click CLI, package `doppio_next`) that adds
a `bench add-next-spa` command, in the spirit of the original
[doppio](https://github.com/NagariaHussain/doppio) (which targets Vite +
Vue/React). It scaffolds a Next.js frontend *inside* a host Frappe app and
wires it to the Frappe backend. This skill covers how to run it, how the
generated app talks to Frappe, and how to extend it consistently.

## Quick reference

```bash
# Install the CLI (once per bench)
bench get-app <doppio_next repo>

# Scaffold a frontend inside apps/<your-app>/<name>
bench add-next-spa --app <your-app> --name frontend \
    [--serving static|standalone] [--no-example]

# Develop
cd apps/<your-app>/frontend && yarn dev     # :8080/<name>, proxies to bench :8000

# Ship
yarn build    # static: exports into <app>/public + <app>/www
              # standalone: next build; then `yarn start` (:3000 behind nginx)
```

Generated stack: Next.js App Router (create-next-app@latest, src dir, Turbopack),
TypeScript, Tailwind v4 (+ `@tailwindcss/typography`), shadcn/ui (12 components
preinstalled), Motion (`motion/react`), frappe-react-sdk, socket.io-client.

## The four integration contracts

Everything between Next and Frappe hangs on these. When something breaks
(401s, CSRF errors, blank assets), check them in order — details and fixes in
`references/integration-contracts.md`:

1. **API**: all data flows through `/api/method/*` and `/api/resource/*` on the
   same origin. Dev uses Next rewrites (`/api`, `/assets`, `/files`,
   `/private` → `127.0.0.1:8000`, with `basePath: false`); prod relies on
   nginx/Frappe serving the same paths.
2. **Auth**: cookie sessions (`user_id` cookie; `Guest` = logged out). POSTs
   need `X-Frappe-CSRF-Token` from `window.csrf_token` — Jinja-injected into
   served HTML in static mode, fetched at runtime by `src/lib/csrf.ts` in
   standalone mode.
3. **Routing**: static mode serves `www/<spa>.html` at `/<spa>` and
   `www/<spa>/<page>.html` per exported route; `basePath: "/<spa>"` keeps
   client URLs aligned. Dynamic segments need `generateStaticParams` or
   query-param routing (`/blog/post?name=...` pattern).
4. **Assets**: static builds set `assetPrefix: "/assets/<app>/<spa>"` and
   `scripts/copy-export.mjs` copies `out/` into `<app>/public/<spa>` (assets)
   and `<app>/www` (HTML, with CSRF snippet injected).

## Choosing a serving mode

- **static** (default): no Node process in production; Frappe serves
  everything. Costs: no SSR/ISR/API routes/server actions; dynamic deep links
  need pre-rendered params. Right for portals, dashboards, admin UIs.
- **standalone**: `output: "standalone"`, `next start -p 3000` behind nginx
  (route `/<spa>` to Next; keep `/api`, `/assets`, `/files`, `/socket.io` on
  Frappe). Full SSR. Right when SEO-critical dynamic pages or server code are
  needed. Requires a supervisor/pm2 entry and the runtime CSRF fetch.

If the user is unsure, recommend static — it matches doppio's proven model and
removes an entire process from ops.

## Extending the generated app

The starter defines conventions; new code should follow them rather than
invent parallel patterns. Full component/pattern catalog in
`references/page-patterns.md`. The essentials:

- Three shells: `SiteHeader`/`SiteFooter` (public pages), `AppHeader` +
  `useRequireAuth` (authenticated app pages), `AdminShell` (admin section,
  sidebar + REST-permission gate at `src/app/admin/layout.tsx`).
- Data via frappe-react-sdk hooks (`useFrappeGetDocList`, `useFrappeGetDoc`,
  `useFrappeGetDocCount`, `useFrappeUpdateDoc`, `useFrappeAuth`); realtime via
  `useFrappeEventListener("list_update", ...)` + `mutate()`. Pass a `null` SWR
  key to defer fetches that depend on the logged-in user.
- Every remote read renders three states: skeleton while loading, friendly
  hint on error (especially for ERPNext-only doctypes like Project/Issue on
  Frappe-only sites), empty-state row when there's no data.
- Motion primitives from `src/components/motion.tsx` (`FadeIn`,
  `StaggerContainer`/`StaggerItem`, `HoverLift`, `AnimatedNumber`) — don't
  hand-roll animations; page-enter transitions come free from
  `src/app/template.tsx`.
- Tokens only (`bg-muted`, `text-muted-foreground`, badge variants) — no
  hardcoded hex; shared `StatCard` for metrics.

## Gotchas worth knowing upfront

- `--no-example` strips app pages but keeps login + libs + public pages.
- Frappe renders `www/*.html` through Jinja: stray `{{`/`{%` in exported HTML
  can break rendering (rare; escape in copy-export.mjs if hit).
- Guest REST access is off by default — public blog/data pages show their
  error hint until guest read is granted.
- Client-side navigation may fall back to full-page loads in static mode when
  RSC payload files aren't reachable; cosmetic only.
- Type-check after scaffolding (`yarn tsc --noEmit`): the templates track
  frappe-react-sdk's current API, and drift is usually a one-line fix in
  `login/page.tsx` or `app-providers.tsx`.
- Never name the SPA the same as the app — the generator refuses.

## References

- `references/integration-contracts.md` — deep dive: dev proxy, CSRF in both
  modes, copy-export pipeline, nginx for standalone, deep-link recipes.
  Read when debugging Next↔Frappe wiring or deploying.
- `references/page-patterns.md` — component catalog, page anatomy, doctypes
  used by each example page, how to add a new page/section correctly.
  Read before adding or modifying pages.
