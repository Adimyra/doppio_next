# Suppliers page for the Doppio Next frontend

Save the file as `apps/crm_app/frontend/src/app/suppliers/page.tsx`, then add a
nav entry to the `NAV` array in `src/components/app-header.tsx` (don't build a
parallel nav):

```tsx
{ href: "/suppliers", label: "Suppliers" },
```

## How it follows the existing conventions

- **Shell + guard**: authenticated app page, so it uses `AppHeader` with a
  `subtitle` and calls `useRequireAuth()` at the top — exactly like
  `/dashboard` and `/projects`.
- **Data**: `useFrappeGetDocList<Supplier>("Supplier", ...)` with explicit
  `fields`, `orderBy: { field: "modified", order: "desc" }`, and a limit —
  same shape as the projects page.
- **Realtime**: `useFrappeEventListener("list_update", ...)` filtered on
  `doctype === "Supplier"` and calling `mutate()`, matching dashboard/projects.
- **Status badges**: ERPNext's Supplier doctype has no single `status` field,
  so status is derived from `disabled`/`on_hold` (Active / On Hold / Disabled)
  and mapped to Badge variants via a `statusVariant` helper, mirroring the
  `statusVariant` pattern in dashboard/projects. Tokens/variants only — no
  hardcoded colors.
- **Search box**: shadcn `Input` in the `CardHeader` with a `useMemo`
  client-side filter over name / supplier_name / supplier_group — the same
  pattern as `/admin/users`.
- **Three render states**: `Skeleton` rows while loading; a friendly error
  hint ("Is ERPNext installed... read access to Suppliers?") since Supplier is
  an ERPNext-only doctype, matching the projects page's hint; and an
  empty-state `TableRow` (with a distinct message when a search yields no
  matches).
- **Motion**: stat cards (Total / Active / On hold / Disabled) use
  `StaggerContainer`/`StaggerItem` + `AnimatedNumber` from
  `@/components/motion`; no hand-rolled animations, and no per-page mount
  animation (that comes from `src/app/template.tsx`).
- **Static export**: the route is static (`/suppliers`, no dynamic segments),
  so it needs no `generateStaticParams` and works unchanged in static-export
  serving mode.

After adding the file, run `yarn tsc --noEmit` in `apps/crm_app/frontend` as a
sanity check, and rebuild (`yarn build`) to re-export in static mode.
