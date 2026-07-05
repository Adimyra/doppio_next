# Suppliers page for the Doppio Next frontend

## Where it goes

Save the file as:

```
apps/crm_app/frontend/src/app/suppliers/page.tsx
```

(or `app/suppliers/page.tsx` if the frontend does not use the `src/` directory). With the Next.js App Router this makes the page available at `/suppliers` — mirroring how the existing `dashboard/` and `projects/` route folders work.

## How it follows the existing conventions

- **`"use client"` at the top.** Doppio Next frontends are built with `output: "export"` (static export) and served by Frappe, so data pages are client components — all fetching happens in the browser against the Frappe REST API, exactly like the dashboard and projects pages.
- **`frappe-react-sdk` for data.** The list is loaded with `useFrappeGetDocList<Supplier>("Supplier", ...)`, which goes through the `FrappeProvider` already set up in the root layout (so auth cookies / tokens and the site URL are handled centrally). Fields fetched: `name`, `supplier_name`, `supplier_group`, `supplier_type`, `country`, `disabled`, `on_hold`, `modified`, ordered by `modified desc` with a limit of 100.
- **Realtime updates.** `useFrappeDocTypeEventListener("Supplier", () => mutate())` subscribes to the Frappe socket.io `doc_update`/list events for the Supplier doctype and revalidates the SWR cache whenever a supplier is created, changed or deleted. This requires `enableSocket` on the `FrappeProvider` (Doppio sets this up by default; the socket port comes from `common_site_config.json`).
- **Search box.** A controlled input filters the fetched list client-side across supplier name, ID, group and country. If your other pages do server-side searching instead, swap the `useMemo` filter for a `filters: [["supplier_name", "like", `%${search}%`]]` entry in the `useFrappeGetDocList` options — SWR will refetch automatically when the key changes.
- **Status badges.** Frappe's Supplier doctype has no single `status` field; status is derived: `disabled` → "Disabled" (gray), `on_hold` → "On Hold" (amber), otherwise "Active" (green). Badges use the same rounded-pill Tailwind pattern common in these frontends.
- **UI states.** The page handles loading (skeleton rows), error (message + retry via `mutate()`), empty and no-search-results states, and each row links to `/suppliers/[name]` for a future detail page.

## Caveats

- I wrote this from general knowledge of Doppio/Frappe/Next.js conventions without reading your actual dashboard/projects pages, so cosmetic details (exact Tailwind tokens, shared `<PageHeader>`/`<Badge>` components, shadcn/ui usage) may differ — if you have shared UI components, substitute them for the inline markup.
- If your app defines a generated `Supplier` type (e.g. from `frappe-types`), import it instead of the local interface.
- Because the site is statically exported, deep links like `/suppliers` must be handled by Doppio's catch-all serving on the Frappe side (already the case for the existing pages).
