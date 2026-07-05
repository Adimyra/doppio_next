# Doppio (NagariaHussain/doppio) — Architecture & Code Structure Research

Repo: https://github.com/NagariaHussain/doppio · License: MIT · Author: Hussain Nagaria (Frappe)
Analyzed: 2026-07-05, `master` @ `426dc49`

## What it is

Doppio is a **Frappe app that acts as a CLI scaffolding tool**. It adds custom `bench` commands that attach Vue 3 or React single-page applications (SPAs) and framework-powered Desk pages to any custom Frappe app. It ships almost no runtime of its own — its output (generated boilerplate inside *your* app) is the product.

## Tools & tech stack

| Layer | Tools |
|---|---|
| CLI framework | Python 3.10+, **Click** ~8.2 (only declared dependency) |
| Host platform | **Frappe Framework** / bench (commands hook into `bench` via `commands` list in `doppio/commands/__init__.py`) |
| Scaffolding | **Vite 5** (`yarn create vite`) with templates `vue`, `vue-ts`, `react`, `react-ts`; **degit** for the frappe-ui starter |
| Frontend (generated) | Vue 3 + vue-router 4 + socket.io-client 4, or React + **frappe-react-sdk** |
| Optional CSS | **Tailwind CSS v3** (+ PostCSS, autoprefixer) via `--tailwindcss` flag |
| Build/packaging | flit_core (Python), yarn/npm subprocess calls, `frappe.build.bundle` for desk pages |
| Templating | `frappe.render_template` (Jinja) for desk-page boilerplates; simple `str.replace` placeholders elsewhere |

## Repository structure

```
doppio/
├── pyproject.toml            # flit build; deps: Click~=8.2; Python >=3.10
├── package.json              # vue ^3.5, socket.io-client ^4.8, vite ^5.4 (for libs/)
├── MANIFEST.in, license.txt (MIT), yarn.lock
├── doppio/                   # the Frappe app (Python package)
│   ├── hooks.py              # standard Frappe hooks; mostly boilerplate
│   ├── modules.txt, patches.txt
│   ├── commands/             # ★ the core of the project
│   │   ├── __init__.py       # Click commands: add-spa, add-desk-page, add-frappe-ui
│   │   ├── spa_generator.py  # SPAGenerator class (~250 lines)
│   │   ├── desk_page.py      # Desk page setup (Page doc + JS bundles)
│   │   ├── frappe_ui.py      # degit's the doppio_frappeui_starter repo
│   │   ├── boilerplates.py   # all code templates as Python string constants
│   │   └── utils.py          # create_file, package.json patching, hooks.py routing
│   ├── config/               # desktop.py, docs.py (Frappe module config)
│   ├── doppio/               # empty module dir
│   ├── templates/pages/      # empty (Frappe convention)
│   └── tests/test_spa_generation.py
└── libs/                     # ★ Vue helper library copied into generated SPAs
    ├── controllers/
    │   ├── call.js           # fetch wrapper for /api/method/* with CSRF + error parsing
    │   ├── auth.js           # Auth class: cookie-based session, login/logout
    │   └── socket.js         # socket.io client → port 9000 realtime
    └── resourceManager/
        ├── ResourceManager.js # declarative reactive data-fetching (Resource class)
        └── index.js           # Vue plugin install ($resources mixin)
```

## Architecture

Three Click commands are registered with bench through Frappe's app-command discovery (`commands = [...]` in `doppio/commands/__init__.py`):

**1. `bench add-spa`** → `SPAGenerator` (spa_generator.py). Pipeline:
scaffold Vite project (subprocess `yarn create vite`) → install deps (vue-router + socket.io-client, or frappe-react-sdk) → write `proxyOptions.js` (dev-server proxy to bench on port 8080→8000) → overwrite `vite.config` (base path `/assets/<app>/<spa>/`, outDir `<app>/public/<spa>`) → for Vue: write router (with auth guards), App/Home/Login views, link controller files in main.js → create `www/` dir + `<spa>.py` context file → inject CSRF token script into index.html → optional Tailwind setup → patch build scripts into package.json (`vite build` + copy `index.html` → `www/<spa>.html`) → regex-insert `website_route_rules` into the host app's `hooks.py`.

**2. `bench add-desk-page`** (desk_page.py). Requires developer mode + site connection (`frappe.init/connect`). Creates a standard **Page** doc, renders Jinja templates into `<module>/page/<name>/<name>.js` and `public/js/<name>/<name>.bundle.js|jsx` + `App.vue`/`App.jsx`, then triggers `frappe.build.bundle("development")` and opens the page in the browser.

**3. `bench add-frappe-ui`** (frappe_ui.py). Clones the separate `NagariaHussain/doppio_frappeui_starter` repo via `npx degit`, runs `yarn`, replaces `<app_name>`/`frontend` placeholders in vite.config.js and src/router.js, patches package.json and hooks.py like add-spa.

Shared plumbing (utils.py): `add_commands_to_root_package_json` (wires `dev`/`build`/`postinstall` so `bench build` works), `add_routing_rule_to_hooks` (regex insert of `{'from_route': '/<spa>/<path:app_path>', 'to_route': '<spa>'}`).

**Key design pattern:** all generated code lives as string constants in `boilerplates.py`; production serving works by building assets into `<app>/public/<spa>` and copying `index.html` to `<app>/www/<spa>.html`, with Frappe's website route rules doing catch-all SPA routing.

## The `libs/` runtime (Vue SPAs only)

- **call.js** — `call(method, args)`: POST `/api/method/<method>` with JSON, `X-Frappe-CSRF-Token` and `X-Frappe-Site-Name` headers; rich parsing of Frappe's `_server_messages`/`exc` error format; auto-redirect to `/login` on 401/403.
- **auth.js** — reads `user_id` cookie to detect session; `login()` via the `login` method, `logout()` + reload.
- **socket.js** — socket.io connection to the Frappe realtime server (port 9000 in dev).
- **ResourceManager.js** — declarative resources (predates/parallels frappe-ui's `createResource`): define `$resources` on components; supports `auto`, `params`, `paged`, `validate`, `keepData`, `onSuccess`/`onError` events, backed by Vue 3 `reactive`/`ref` watchers.

React SPAs skip libs/ entirely and rely on **frappe-react-sdk** for the same concerns.

## Relevance to Doppio Next (Next.js + TypeScript port)

- The scaffolding is Vite-centric; a Next.js port must replace the dev proxy (`proxyOptions.js`) with Next `rewrites()`, and the static `www`/`public` build output with either `next export`-style static output into `<app>/public` or a standalone Next server.
- The four integration contracts to preserve: (1) `/api/method/*` + CSRF headers, (2) cookie-based session (`user_id`), (3) `website_route_rules` catch-all in hooks.py, (4) build base path `/assets/<app>/<spa>/`.
- `call.js`/`auth.js` translate directly to typed TS utilities or you can standardize on frappe-react-sdk; ResourceManager maps to SWR/React Query patterns.
- CSRF injection depends on Jinja rendering of `www/<spa>.html` — SSR'd Next pages need a different bootstrap (e.g. `/api/method/frappe.auth.get_logged_user` + a csrf endpoint) if not served through Frappe's www.
