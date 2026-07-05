# Page & component patterns in the generated app

## Shells — pick the right one

| Shell | File | Use for | Guard |
|---|---|---|---|
| `SiteHeader` + `SiteFooter` | `src/components/site-header.tsx` | Public pages (/, /about, /blog) | none |
| `AppHeader` | `src/components/app-header.tsx` | Authenticated app pages | `useRequireAuth()` (redirects to /login) |
| `AdminShell` | `src/app/admin/layout.tsx` | Admin section | `useRequireAuth()` + REST 403 probe (`useFrappeGetDocCount("User")`) → "Access denied" card |

`AppHeader` nav lives in its `NAV` array; admin nav in the layout's `NAV`.
Add sections there — don't build parallel navs. The avatar dropdown links to
/profile and /admin.

## Existing pages (what they demonstrate)

| Route | Doctype(s) | Patterns shown |
|---|---|---|
| `/` | — | Landing: FadeIn hero, StaggerContainer feature grid, HoverLift cards |
| `/about` | — | Static server component, `metadata` export |
| `/blog`, `/blog/post?name=` | Blog Post | Public data + guest-permission hint; query-param detail with Suspense; `prose` (typography plugin) for HTML content |
| `/login` | — | `useFrappeAuth().login({username, password})`, sonner toasts |
| `/dashboard` | ToDo, User, File | StatCard grid, doclist table, realtime `list_update` → `mutate()` |
| `/projects` | Project (ERPNext) | Derived stats, progress bars (token-based, no plugin), overdue logic, ERPNext-missing hint |
| `/portal` | Issue, ToDo | Per-user filters (`raised_by` / `allocated_to` = currentUser), deferred fetch via `null` SWR key |
| `/profile` | User | `useFrappeGetDoc` + `useFrappeUpdateDoc` edit form |
| `/admin`, `/admin/users`, `/admin/logs` | User, Role, Activity Log, Error Log | Sidebar layout, mobile Sheet drawer, search filter, enable/disable action with protected rows (Administrator, Guest) |

## Data-fetching conventions

```tsx
const { data, isLoading, error, mutate } = useFrappeGetDocList<T>("Doctype", {
  fields: [...], filters: [...], orderBy: { field, order }, limit,
});
useFrappeEventListener("list_update", (d) => { if (d?.doctype === "Doctype") mutate(); });
```

- Defer user-dependent fetches: third arg `currentUser ? undefined : null`
  (null SWR key = don't fetch yet). Same for `useFrappeGetDoc`.
- Render all three states: `Skeleton` rows while loading; a muted, actionable
  hint on `error` (say *why* — missing ERPNext, guest permissions); an
  empty-state `TableRow` when the list is empty.
- ToDo `description` and Blog Post `content` are HTML — render via
  `dangerouslySetInnerHTML`, never as text.
- Writes: `useFrappeUpdateDoc`, toast success/failure with sonner, `mutate()`
  after. Keep destructive/complex writes in the Desk (starter only toggles
  User.enabled, with Administrator/Guest protected).

## Motion conventions

`src/components/motion.tsx` exports the only primitives pages should need:

- `FadeIn` (delay, y, inView) — heroes, single cards
- `StaggerContainer` + `StaggerItem` — grids and card lists
- `HoverLift` — clickable cards/tiles
- `AnimatedNumber` — any metric (used by shared `StatCard`)

Page-enter transitions are global (`src/app/template.tsx`) — don't add
per-page mount animations for whole pages. Import from `motion/react` (the
`motion` package), not `framer-motion`.

## Adding a new page — checklist

1. Pick the shell (public / app / admin) and add the route under `src/app/`.
2. `"use client"` for anything using hooks; keep static content as server
   components with `metadata`.
3. Fetch with frappe-react-sdk hooks; wire realtime if the data changes.
4. Skeleton + error hint + empty state.
5. Reuse `StatCard`, Badge variant helpers, and motion primitives.
6. Add the nav entry to the relevant shell's `NAV`.
7. Static-export check: dynamic segments need `generateStaticParams` or the
   query-param pattern; `useSearchParams` needs a Suspense boundary.
8. Tokens only — no hex values; check dark mode survives (shadcn tokens do).

## shadcn/ui inventory

Preinstalled: button, card, input, label, table, badge, avatar, separator,
dropdown-menu, tooltip, skeleton, sonner, sheet. Add more with
`npx shadcn@latest add <name> --yes` — don't hand-copy component code.
