# New Pattern: Admin Panel (`AdminShell` + admin pages)

## Problem

The starter has app pages (top-nav `AppHeader`) and public pages (`SiteHeader`), but no pattern for dense, privileged, multi-section management UI. Admins need user management, error visibility, and system stats — behind a role gate, with persistent section navigation.

## Existing Patterns

| Related Component | Similarity | Why It's Not Enough |
|-------------------|-----------|---------------------|
| `AppHeader` | Auth-guarded nav, avatar menu | Flat top nav; no room for a growing list of admin sections |
| Dashboard page | Stat cards + table | Inline `StatCard` (duplicated in projects); no privileged-access gate |
| `SiteHeader` | Nav shell | Public, unauthenticated |

## Proposed Design

### New components

**`AdminShell`** (`src/app/admin/layout.tsx`) — sidebar layout pattern:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `children` | ReactNode | — | Page content |

Desktop: fixed 220px sidebar (`border-r`, `bg-muted/40`), nav items as ghost buttons with active state (`bg-accent`). Mobile (<md): sidebar collapses into a `Sheet` triggered by a menu button. Includes "Back to app" escape hatch. Guards: `useRequireAuth` + access probe (see States).

**`StatCard`** (`src/components/stat-card.tsx`) — extracted from dashboard (dedupe), now shared by dashboard, admin overview:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | — | Card label |
| `value` | number? | — | Animated via `AnimatedNumber` |
| `loading` | boolean | false | Renders `Skeleton` |

### Pages

| Route | Contents |
|-------|----------|
| `/admin` | Stat cards (Users, Roles, Error Logs) + recent Activity Log table |
| `/admin/users` | Searchable user table; type/status badges; enable/disable action (`useFrappeUpdateDoc`); Administrator/Guest rows protected |
| `/admin/logs` | Recent Error Log table (method, timestamp, seen badge) |

### States

| State | Behavior | Notes |
|-------|----------|-------|
| Unauthenticated | Redirect to `/login` | via `useRequireAuth` |
| Authenticated, non-admin | "Access denied" card | Probe = `useFrappeGetDocCount("User")`; Frappe returns 403 for non-System-Managers |
| Loading | Skeletons (cards + rows) | Same pattern as dashboard |
| Realtime | `list_update` refresh on User/Error Log | Same pattern as dashboard |

### Tokens Used

Colors: `bg-muted/40`, `bg-accent`, `text-muted-foreground`, `destructive` badge — no hardcoded hex. Spacing: standard `p-6`, `gap-4`, `space-y-6`. Motion: `StaggerContainer`/`StaggerItem`, `AnimatedNumber`, global page transition (inherited).

### Accessibility

- Sidebar: `<nav aria-label="Admin">`; active item `aria-current="page"`.
- Mobile menu: `Sheet` (Radix Dialog) — focus trap, Esc closes, trigger has `aria-label`.
- Enable/disable: real `<Button>`s, disabled state for protected users; row action announced by button text, not color alone.

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|------|---------|
| Add admin sections as new `NAV` entries in the admin layout | Bolt admin links into the public `SiteHeader` |
| Use `StatCard` for any new metric | Re-inline stat card markup per page |
| Gate by server-enforced permissions (403 probe) | Trust client-side role checks alone — REST perms are the real gate |

### Open Questions

- Session management (Frappe `Sessions` cleanup) and role editing are out of scope — deliberate: writes beyond enable/disable should go through the Desk.
