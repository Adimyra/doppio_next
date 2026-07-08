# Doppio Next — Developer Guide

Technical internals for people hacking on doppio_next itself (the generator, the templates, or the generated portal).

**Author:** Md Faiyaz Ansari · [Adimyra Systems Private Limited](mailto:care@adimyra.com)

---

## Quick dev loop: full fresh-scaffold test

The fastest way to verify the whole pipeline end-to-end is to destroy and recreate a test app. Two lines:

```bash
# 1 — remove completely (site + bench)
cd $BENCH_DIR && bench --site <site> uninstall-app <app> --yes && bench remove-app <app>

# 2 — recreate, install, scaffold, build, serve
bench new-app <app> && bench --site <site> install-app <app> && bench add-next-spa --app <app> --name frontend --serving static && (cd apps/<app>/frontend && yarn build) && bench --site <site> clear-cache
```

Then verify on the site:

- `/` renders the SPA (home_page was auto-set)
- `/login`, `/about`, `/contact`, `/update-password?key=x` all 301 to `/frontend/...` (hooks redirects)
- Website Settings has the **Adi Settings** tab (custom fields)
- `apps/<app>/<app>/website_api.py` exists and `hooks.py` ends with the doppio_next block

Install/scaffold order does **not** matter: site configuration runs from the app's own `after_install` hook, and the generator calls the same function when the app is already installed.

## Architecture

```
doppio_next/
├── doppio_next/
│   ├── commands/
│   │   ├── __init__.py           # click command: bench add-next-spa
│   │   └── next_generator.py     # NextSPAGenerator — the whole pipeline
│   └── templates_next/           # overlaid onto the scaffolded SPA
│       ├── next.config.ts        # dev proxy + static export (port placeholders)
│       ├── scripts/copy-export.mjs
│       ├── _backend/website_api.py   # installed into the HOST APP module
│       ├── _variants/
│       │   ├── brand-theme.css        # --brand-* palette appended to globals.css
│       │   └── next.config.standalone.ts
│       └── src/                   # pages + components (see below)
```

### Generator pipeline (`NextSPAGenerator.generate`)

1. `resolve_node()` — if `node` on PATH is < 20.9, prepends the newest suitable `~/.nvm/versions/node/*/bin` to the subprocess PATH. All `subprocess.run` calls pass `env=self.env`.
2. `create_next_app()` — `create-next-app@latest` (App Router, TS, Tailwind v4, src dir, yarn).
3. `install_dependencies()` — `frappe-react-sdk socket.io-client motion next-themes` + `@tailwindcss/typography`.
4. `setup_shadcn()` — CLI flag drift handling: tries `--base radix --preset nova`, then older flag sets; **verifies `components.json` exists** because shadcn ≥ 4.13 can abort its interactive preset prompt while still exiting 0. Then adds the component set (`SHADCN_COMPONENTS`).
5. `apply_templates()` — copies `src/**` replacing placeholders (below), skips `_variants`/`_backend`, installs `_backend/website_api.py` into `<app>/<app>/` (never overwrites), patches `globals.css` (typography plugin, Geist font fix for the nova preset's self-referencing `--font-sans`, appends `brand-theme.css`).
6. `patch_spa_package_json()` / `patch_root_package_json()` — dev/build scripts, multi-SPA aware (`build:<name>` etc.).
7. `maybe_set_home_page()` — connects to the bench's default site; if the app is installed, calls `setup_website_defaults()` (below), else defers to the hook.
8. `patch_hooks_redirects()` — appends a marker-guarded block to the host app's `hooks.py`.

### Placeholders (replaced at scaffold time)

| Placeholder | Value |
|---|---|
| `__APP__` | host app name |
| `__SPA__` | SPA name (= URL basePath) |
| `__WEB_PORT__` | `common_site_config.json` → `webserver_port` (default 8000) |
| `__SOCKET_PORT__` | `common_site_config.json` → `socketio_port` (default 9000) |

### The hooks.py block

Appended once (guarded by the `# --- doppio_next website redirects` marker):

- `website_redirects` — `/login`, `/update-password`, `/about`, `/contact` → SPA equivalents, `forward_query_parameters: 1` (so `?redirect-to=` and reset `?key=` survive). Merged with any pre-existing list via `globals().get(...)`.
- `after_install` — `<app>.website_api.on_app_install`, merged the same way (handles both str and list forms).

### Site setup (`website_api.setup_website_defaults`)

Lives in the **generated app**, not in doppio_next — so production sites don't need doppio_next installed:

- `create_custom_fields` for the whole **Adi Settings** tab (`ADI_SETTINGS_FIELDS` in the same file; the tab break's `insert_after` resolves to the current last field at runtime).
- Sets Website Settings `home_page` to the SPA **only when it's empty** (never steals an existing homepage — also why a second SPA doesn't take over).
- `on_app_install()` wraps it in try/except + `frappe.log_error` so a setup failure never blocks `install-app`.

## Backend API surface (`<app>/website_api.py`)

| Endpoint | Guest | Purpose |
|---|---|---|
| `get_website_settings` | ✓ | branding/nav/theme subset of Website Settings incl. all Adi Settings fields |
| `get_about_settings` | ✓ | About Us Settings (None when empty/disabled → SPA fallback copy) |
| `get_contact_settings` | ✓ | Contact Us Settings incl. composed address lines + query options |
| `get_social_logins` | ✓ | enabled Social Login Keys with ready `get_oauth2_authorize_url` links |
| `subscribe` | ✓ | newsletter → Email Group "Website" (validated, deduped, rate-guarded) |
| `sign_up` | ✓ | Frappe's sign-up flow + `mobile_no` (same return codes, `disable_signup` enforced) |
| `get_session_user` | | avatar/profile + `desk_access` (`user_type == "System User"`) |
| `update_my_profile` | | own first/last/mobile/phone only |
| `get_portal_sections` | | Portal Settings menu filtered by the user's roles |
| `get_portal_list` | | generic per-doctype list, party-scoped via ERPNext contact linkage → `raised_by` → `owner`; adaptive columns |
| `raise_issue` | | creates an Issue as the session user |
| `set_homepage_design` | | "Use this" on /demos — requires Website Settings write |

Form submissions reuse core Frappe endpoints where they exist: `frappe.www.contact.send_message`, `frappe.core.doctype.user.user.reset_password` / `update_password`, `frappe.utils.global_search.web_search`.

## Frontend internals (`src/`)

- `lib/website-settings.ts` — `useWebsiteSettings()` (SWR key `website-settings`), `useSessionUser()` (key `session-user`, skipped while logged out via null key), `resolveItemUrl` (`/home`→`/`, external detection), `brandImage`.
- `components/theme-provider.tsx` — next-themes (class strategy); `SiteDefaultTheme` applies Adi Settings default until the visitor toggles (localStorage `theme-user-choice`); `BrandTheme` derives the full `--brand-*` palette from the two brand colors (JS hex mixing) and injects a `<style id="brand-theme-overrides">` that wins the cascade. All component colors reference `var(--brand-*)` — never hardcode brand hexes in templates.
- `components/site-header.tsx` — navbar (Top Bar Items with `parent_label` dropdowns, custom Plain/Gradient background, CTA from `call_to_action*`, search → `/search`, avatar menu) + footer (grouped columns where a parent label is a heading, newsletter form, dynamic contact, `footer_powered`).
- `components/auth-shell.tsx` — split-screen shell + `PasswordInput`, shared by login/signup/forgot (`/login`, hash deep links `#signup` / `#forgot`) and `/update-password`. Login honors `?redirect-to=` (same-site paths only; hard navigation because targets like `/app` are outside the SPA).
- `components/home-designs.tsx` — `HOME_DESIGNS` registry (5 compact designs + classic landing in `app/page.tsx`), content overrides from Adi Settings, `DemoBanner` with the permission-gated switch.
- `app/my-account/page.tsx` — sidebar/pills layout; sections from `get_portal_sections`; read-only profile with edit mode; account-deletion link (→ `/request-to-delete-data`) when enabled.
- Brand glyphs for team-member social links are inlined SVGs (`app/about/page.tsx`) — **lucide-react removed its brand icons**, don't import `Facebook`/`Twitter`/etc. from it.

## Gotchas we hit (so you don't)

- **Website redirect caching**: rules are cached in redis hash `website_redirects` *and* the computed `website_settings` value. After changing rules: `frappe.cache.delete_value("website_redirects")`, `delete_value("app_hooks")`, `clear_cache()` — and remember the dev web worker may hold stale module state (touch a .py file to trigger the reloader).
- **Another app claiming the same route** (e.g. an old doppio SPA named `frontend` with a `website_route_rules` catch-all) hijacks every deep link. Check all installed apps' hooks when deep links serve the wrong page.
- **shadcn nova preset** emits `--font-sans: var(--font-sans)` (self-referencing) and applies `font-sans` on `<html>` while Next puts Geist variables on `<body>` → Times fallback. The generator patches both.
- **Static export**: no SSR; unknown site-level URLs get Frappe's 404 (the SPA `not-found.tsx` covers in-app navigation); dynamic deep links need `generateStaticParams` or query params (`/blog/post?name=...` pattern).
- **Node**: `create-next-app` needs ≥ 20.9; the generator self-heals via nvm but a stale `/usr/local/bin/node` earlier in PATH than the nvm loader in `.zshrc` will bite every non-generator tool.

## Iterating on templates against an existing scaffold

Templates are only read at scaffold time. To push a template change into an already-scaffolded app without re-scaffolding:

```bash
T=apps/doppio_next/doppio_next/templates_next
F=apps/<app>/<spa>
sed -e 's/__SPA__/<spa>/g' -e 's/__APP__/<app>/g' \
    -e 's/__WEB_PORT__/<port>/g' -e 's/__SOCKET_PORT__/<port>/g' \
    "$T/src/path/to/file.tsx" > "$F/src/path/to/file.tsx"
```

(`website_api.py` goes to `apps/<app>/<app>/website_api.py`.) Then `yarn build` + `bench --site <site> clear-cache` for production, or let the dev server hot-reload. Type-check with `yarn tsc --noEmit` inside the SPA — templates can only be verified inside a scaffolded app.

---

Created by **Md Faiyaz Ansari** — Adimyra Systems Private Limited.
