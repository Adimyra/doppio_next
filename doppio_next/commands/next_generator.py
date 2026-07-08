import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import click

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates_next"

# create-next-app / Next.js floor (matches "engines" written into package.json)
MIN_NODE = (20, 9, 0)


def _parse_node_version(raw: str):
    """'v20.19.5' -> (20, 19, 5), or None if unparseable."""
    match = re.match(r"v?(\d+)\.(\d+)\.(\d+)", raw.strip())
    return tuple(int(g) for g in match.groups()) if match else None


def _node_version(node_bin: str = "node"):
    try:
        out = subprocess.run(
            [node_bin, "-v"], capture_output=True, text=True, check=True
        ).stdout
    except (OSError, subprocess.CalledProcessError):
        return None
    return _parse_node_version(out)

# Names that would shadow Frappe/bench routes or break serving
RESERVED_NAMES = {
    "api",
    "app",
    "assets",
    "desk",
    "files",
    "login",
    "private",
    "public",
    "socket.io",
    "templates",
    "www",
}

NAME_PATTERN = re.compile(r"^[a-z][a-z0-9_-]*$")

SHADCN_COMPONENTS = [
    "button",
    "card",
    "input",
    "label",
    "table",
    "badge",
    "avatar",
    "separator",
    "dropdown-menu",
    "tooltip",
    "skeleton",
    "sonner",
    "sheet",
]


class NextSPAGenerator:
    """Scaffolds a Next.js (App Router, TypeScript, Tailwind v4, shadcn/ui)
    frontend inside a Frappe app and wires it to the Frappe backend."""

    def __init__(
        self,
        spa_name: str,
        app: str,
        with_example: bool = True,
        serving: str = "static",
    ):
        self.spa_name = spa_name
        self.app = app
        self.with_example = with_example
        self.serving = serving
        self.app_path = Path("../apps") / app
        self.spa_path: Path = self.app_path / spa_name
        self.env = os.environ.copy()

        # Bench ports for the dev proxy / realtime socket (cwd is the
        # sites dir). Frappe defaults when the bench doesn't override.
        config_path = Path("common_site_config.json")
        config = (
            json.loads(config_path.read_text()) if config_path.exists() else {}
        )
        self.web_port = config.get("webserver_port", 8000)
        self.socket_port = config.get("socketio_port", 9000)

        self.validate()
        self.resolve_node()

    def validate(self):
        if self.spa_name == self.app:
            click.echo("Frontend name must not be the same as app name", err=True)
            exit(1)

        if not NAME_PATTERN.match(self.spa_name):
            click.echo(
                f"Invalid name '{self.spa_name}': use lowercase letters, "
                "digits, '-' or '_', starting with a letter "
                "(it becomes the URL: /<name>)",
                err=True,
            )
            exit(1)

        if self.spa_name in RESERVED_NAMES:
            click.echo(
                f"'{self.spa_name}' is a reserved Frappe route — pick another "
                "name (e.g. shop, crm, portal2)",
                err=True,
            )
            exit(1)

        if not self.app_path.exists():
            click.echo(f"App directory not found: {self.app_path}", err=True)
            exit(1)

        if self.spa_path.exists():
            click.echo(f"{self.spa_path} already exists, aborting.", err=True)
            exit(1)

        if not TEMPLATES_DIR.exists():
            click.echo(f"Templates dir missing: {TEMPLATES_DIR}", err=True)
            exit(1)

    def resolve_node(self):
        """Ensure Node >= 20.9 for every subprocess this generator spawns.

        If the Node on PATH is too old, fall back to the newest suitable
        version installed under nvm by prepending its bin dir to PATH.
        Only errors out when no usable Node exists anywhere."""
        current = _node_version()
        if current and current >= MIN_NODE:
            return

        found = "v" + ".".join(map(str, current)) if current else "none"

        nvm_node_dir = (
            Path(self.env.get("NVM_DIR", Path.home() / ".nvm"))
            / "versions"
            / "node"
        )
        candidates = []
        if nvm_node_dir.is_dir():
            for entry in nvm_node_dir.iterdir():
                version = _parse_node_version(entry.name)
                if (
                    version
                    and version >= MIN_NODE
                    and (entry / "bin" / "node").is_file()
                ):
                    candidates.append((version, entry / "bin"))

        if candidates:
            version, bin_dir = max(candidates)
            self.env["PATH"] = f"{bin_dir}{os.pathsep}{self.env['PATH']}"
            click.echo(
                f"⬆️  Node on PATH is {found} (need >= 20.9) — using nvm's "
                f"Node v{'.'.join(map(str, version))} from {bin_dir}"
            )
            return

        click.echo(
            f"Node >= 20.9 is required, but found {found} and no suitable "
            "version under nvm.\nFix with:\n"
            "  nvm install 20 && nvm use 20\n"
            "or if nvm itself is missing:\n"
            "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/"
            "v0.40.1/install.sh | bash\n"
            "then restart your terminal and re-run this command.",
            err=True,
        )
        exit(1)

    # ------------------------------------------------------------------ #
    def generate(self):
        click.echo("⚡ Scaffolding Next.js app (create-next-app)...")
        self.create_next_app()

        click.echo("📦 Installing Frappe integration dependencies...")
        self.install_dependencies()

        click.echo("🎨 Initializing shadcn/ui...")
        self.setup_shadcn()

        click.echo("🔗 Applying Frappe integration templates...")
        self.apply_templates()

        click.echo("🛠  Patching package.json scripts...")
        self.patch_spa_package_json()
        spas = self.patch_root_package_json()

        click.echo("🏠 Updating website home page...")
        self.maybe_set_home_page(spas)

        prod_note = (
            "yarn build (exports into your app's public/ and www/)"
            if self.serving == "static"
            else "yarn build && yarn start (Node server on :3000 — "
            "see README for nginx routing)"
        )
        click.echo(
            click.style("\n✅ Done!", fg="green")
            + f"\n\ncd {self.spa_path.resolve()} && yarn dev"
            + f"\n→ dev server: http://localhost:8080/{self.spa_name}"
            + f"\n→ production: {prod_note}"
        )
        if self.serving == "static":
            click.echo(
                "Note: deep links only work for statically exported routes "
                "(see README: generateStaticParams)."
            )

    # ------------------------------------------------------------------ #
    def create_next_app(self):
        subprocess.run(
            [
                "npx",
                "create-next-app@latest",
                self.spa_name,
                "--typescript",
                "--tailwind",
                "--eslint",
                "--app",
                "--src-dir",
                "--turbopack",
                "--import-alias",
                "@/*",
                "--use-yarn",
                "--yes",
            ],
            cwd=self.app_path,
            check=True,
            env=self.env,
        )

    def install_dependencies(self):
        subprocess.run(
            ["yarn", "add", "frappe-react-sdk", "socket.io-client", "motion", "next-themes"],
            cwd=self.spa_path,
            check=True,
            env=self.env,
        )
        # Typography plugin for rendered Blog Post HTML
        subprocess.run(
            ["yarn", "add", "-D", "@tailwindcss/typography"],
            cwd=self.spa_path,
            check=True,
            env=self.env,
        )

    def setup_shadcn(self):
        # The starter templates use Radix idioms (asChild on Button and
        # the Dropdown/Sheet triggers). shadcn CLI 4.x defaults to Base UI
        # ("base-nova" style, no asChild), so pin the Radix library.
        # Flags drift between CLI majors — try newest first:
        #   4.13+: --base radix --preset nova (interactive preset prompt
        #          added in 4.13; without the flag, init hangs/aborts)
        #   4.x:   --base radix
        #   2-3x:  --base-color neutral (radix was the only library)
        attempts = [
            ["npx", "shadcn@latest", "init", "--yes",
             "--base", "radix", "--preset", "nova"],
            ["npx", "shadcn@latest", "init", "--yes", "--base", "radix"],
            ["npx", "shadcn@latest", "init", "--yes", "--base-color", "neutral"],
        ]
        for i, cmd in enumerate(attempts):
            try:
                subprocess.run(cmd, cwd=self.spa_path, check=True, env=self.env)
            except subprocess.CalledProcessError:
                if i == len(attempts) - 1:
                    raise
                continue
            # A CLI that exits 0 after an aborted prompt leaves no config —
            # treat that as failure and try the next flag combination.
            if (self.spa_path / "components.json").exists():
                break
        else:
            click.echo(
                "shadcn init did not produce components.json — run "
                f"'npx shadcn@latest init' manually in {self.spa_path}",
                err=True,
            )
            exit(1)
        subprocess.run(
            ["npx", "shadcn@latest", "add", "--yes", "--overwrite"]
            + SHADCN_COMPONENTS,
            cwd=self.spa_path,
            check=True,
            env=self.env,
        )

    # ------------------------------------------------------------------ #
    def apply_templates(self):
        """Copy template files into the SPA, replacing placeholders."""
        for src in TEMPLATES_DIR.rglob("*"):
            if src.is_dir():
                continue

            rel = src.relative_to(TEMPLATES_DIR)

            # Variants and backend files are applied explicitly below
            if "_variants" in rel.parts or "_backend" in rel.parts:
                continue

            # Skip example pages if not wanted
            example_parts = {"blog"}
            if not self.with_example and example_parts & set(rel.parts):
                continue

            # Standalone mode: no static-export copy step
            if self.serving == "standalone" and "scripts" in rel.parts:
                continue

            dest = self.spa_path / rel
            dest.parent.mkdir(parents=True, exist_ok=True)

            content = src.read_text()
            content = content.replace("__APP__", self.app)
            content = content.replace("__SPA__", self.spa_name)
            content = content.replace("__WEB_PORT__", str(self.web_port))
            content = content.replace("__SOCKET_PORT__", str(self.socket_port))
            dest.write_text(content)

        # Enable the typography plugin (Tailwind v4 @plugin directive)
        globals_css = self.spa_path / "src/app/globals.css"
        if globals_css.exists():
            css = globals_css.read_text()
            if "@tailwindcss/typography" not in css:
                css = css.replace(
                    '@import "tailwindcss";',
                    '@import "tailwindcss";\n@plugin "@tailwindcss/typography";',
                    1,
                )
            # shadcn's nova preset emits a self-referencing
            # `--font-sans: var(--font-sans)` — the variable resolves to
            # nothing and the whole app falls back to Times. Point it at
            # the Geist variable that create-next-app's layout defines.
            css = css.replace(
                "--font-sans: var(--font-sans);",
                "--font-sans: var(--font-geist-sans);",
            ).replace(
                "--font-heading: var(--font-sans);",
                "--font-heading: var(--font-geist-sans);",
            )
            # Brand palette overrides (win the cascade by coming last)
            brand_css = TEMPLATES_DIR / "_variants" / "brand-theme.css"
            if brand_css.exists() and "Brand theme" not in css:
                css += brand_css.read_text()
            globals_css.write_text(css)

        # Guest API for Website Settings (branding/navigation) — lives in
        # the host app's module so the SPA works without doppio_next
        # installed on the site. Never overwrite user modifications.
        backend_src = TEMPLATES_DIR / "_backend" / "website_api.py"
        backend_dest = self.app_path / self.app / "website_api.py"
        if backend_src.exists() and not backend_dest.exists():
            content = backend_src.read_text()
            content = content.replace("__APP__", self.app)
            content = content.replace("__SPA__", self.spa_name)
            content = content.replace("__WEB_PORT__", str(self.web_port))
            content = content.replace("__SOCKET_PORT__", str(self.socket_port))
            backend_dest.write_text(content)

        # Serving-mode variant of next.config.ts
        if self.serving == "standalone":
            variant = TEMPLATES_DIR / "_variants" / "next.config.standalone.ts"
            content = variant.read_text()
            content = content.replace("__APP__", self.app)
            content = content.replace("__SPA__", self.spa_name)
            content = content.replace("__WEB_PORT__", str(self.web_port))
            content = content.replace("__SOCKET_PORT__", str(self.socket_port))
            (self.spa_path / "next.config.ts").write_text(content)

    def patch_spa_package_json(self):
        package_json_path = self.spa_path / "package.json"
        data = json.loads(package_json_path.read_text())

        # Node 20.9 is Next.js's floor and ships with Frappe v15 benches;
        # v16 benches (Node 24) satisfy it too.
        data["engines"] = {"node": ">=20.9", "yarn": ">=1.22"}

        data["scripts"]["dev"] = "next dev -p 8080"
        if self.serving == "static":
            data["scripts"]["build"] = (
                "next build && node scripts/copy-export.mjs"
            )
        else:
            data["scripts"]["build"] = "next build"
            data["scripts"]["start"] = "next start -p 3000"

        package_json_path.write_text(json.dumps(data, indent=2) + "\n")

    def patch_root_package_json(self):
        """Wire dev/build/postinstall into the host app's root package.json
        so `bench build` picks every frontend up.

        Supports multiple SPAs per app (e.g. shop + crm): each gets
        namespaced scripts (build:shop, dev:crm, ...), and the aggregate
        `build`/`postinstall` scripts chain all of them. `dev` points at
        the most recently scaffolded SPA (run `yarn dev:<name>` for others —
        each dev server needs its own port anyway).
        """
        root_package_json = self.app_path / "package.json"

        if not root_package_json.exists():
            subprocess.run(["npm", "init", "--yes"], cwd=self.app_path, check=True, env=self.env)

        data = json.loads(root_package_json.read_text())
        scripts = data.setdefault("scripts", {})

        scripts[f"dev:{self.spa_name}"] = f"cd {self.spa_name} && yarn dev"
        scripts[f"build:{self.spa_name}"] = f"cd {self.spa_name} && yarn build"
        scripts[f"postinstall:{self.spa_name}"] = (
            f"cd {self.spa_name} && yarn install"
        )

        spas = sorted(
            key.split(":", 1)[1]
            for key in scripts
            if key.startswith("build:")
        )
        scripts["build"] = " && ".join(f"yarn build:{s}" for s in spas)
        scripts["postinstall"] = " && ".join(
            f"yarn postinstall:{s}" for s in spas
        )
        scripts["dev"] = f"yarn dev:{self.spa_name}"

        root_package_json.write_text(json.dumps(data, indent=2) + "\n")
        return spas

    def maybe_set_home_page(self, spas):
        """Point Website Settings.home_page at the SPA on the bench's
        current site — but only when this is the app's only SPA, so a
        second scaffold never silently steals the home page. Best
        effort: scaffolding still succeeds without a usable site."""
        if len(spas) > 1:
            click.echo(
                f"App has multiple SPAs ({', '.join(spas)}) — leaving "
                "Website Settings home_page unchanged. Change it under "
                "Desk → Website Settings if needed."
            )
            return

        site = None
        currentsite = Path("currentsite.txt")  # cwd is the sites dir
        if currentsite.exists():
            site = currentsite.read_text().strip() or None
        if not site:
            config = Path("common_site_config.json")
            if config.exists():
                site = json.loads(config.read_text()).get("default_site")
        if not site:
            click.echo(
                "No default site found (bench use <site> to set one) — "
                f"set '{self.spa_name}' as Home Page under Desk → "
                "Website Settings."
            )
            return

        try:
            import frappe

            frappe.init(site=site)
            frappe.connect()
            try:
                if self.app not in frappe.get_installed_apps():
                    click.echo(
                        f"{self.app} is not installed on {site} — after "
                        f"'bench --site {site} install-app {self.app}', set "
                        f"'{self.spa_name}' as Home Page under Desk → "
                        "Website Settings."
                    )
                    return
                ws = frappe.get_doc("Website Settings")
                ws.home_page = self.spa_name
                # Route Frappe's password-reset emails
                # (/update-password?key=...) to the SPA's reset page.
                if not any(
                    (row.source or "").strip("/ ") == "update-password"
                    for row in ws.route_redirects
                ):
                    ws.append(
                        "route_redirects",
                        {
                            "source": "update-password",
                            "target": f"/{self.spa_name}/update-password",
                            "forward_query_parameters": 1,
                        },
                    )
                ws.flags.ignore_permissions = True
                ws.save()

                # "Adi Settings" tab on Website Settings with the
                # default theme the SPA opens in (visitor toggle wins
                # after they change it once).
                from frappe.custom.doctype.custom_field.custom_field import (
                    create_custom_fields,
                )

                last_field = frappe.get_meta(
                    "Website Settings"
                ).fields[-1].fieldname
                create_custom_fields(
                    {
                        "Website Settings": [
                            {
                                "fieldname": "adi_settings_tab",
                                "fieldtype": "Tab Break",
                                "label": "Adi Settings",
                                "insert_after": last_field,
                            },
                            {
                                "fieldname": "default_website_theme",
                                "fieldtype": "Select",
                                "label": "Default Website Theme",
                                "options": "Light\nDark",
                                "default": "Light",
                                "insert_after": "adi_settings_tab",
                                "description": "Theme the website opens "
                                "in. Visitors can still switch with the "
                                "sun/moon toggle.",
                            },
                            {
                                "fieldname": "homepage_design",
                                "fieldtype": "Select",
                                "label": "Homepage Design",
                                "options": "classic\necommerce\nportal"
                                "\npersonal\nerpnext\ncustom",
                                "default": "classic",
                                "insert_after": "default_website_theme",
                                "description": "Design the homepage "
                                "renders with. Preview them under /demos "
                                "on the site.",
                            },
                            {
                                "fieldname": "homepage_content_section",
                                "fieldtype": "Section Break",
                                "label": "Homepage Content",
                                "insert_after": "homepage_design",
                            },
                            {
                                "fieldname": "homepage_title",
                                "fieldtype": "Data",
                                "label": "Homepage Title",
                                "insert_after": "homepage_content_section",
                                "description": "Hero heading. Leave blank "
                                "for the design default.",
                            },
                            {
                                "fieldname": "homepage_tagline",
                                "fieldtype": "Small Text",
                                "label": "Homepage Tagline",
                                "insert_after": "homepage_title",
                                "description": "One or two lines under "
                                "the heading.",
                            },
                            {
                                "fieldname": "homepage_cta_label",
                                "fieldtype": "Data",
                                "label": "CTA Label",
                                "insert_after": "homepage_tagline",
                                "description": "Main button text, e.g. "
                                "Shop now.",
                            },
                            {
                                "fieldname": "homepage_cta_url",
                                "fieldtype": "Data",
                                "label": "CTA URL",
                                "insert_after": "homepage_cta_label",
                                "description": "Where the main button "
                                "goes, e.g. /login or https://...",
                            },
                            {
                                "fieldname": "navbar_footer_section",
                                "fieldtype": "Section Break",
                                "label": "Navbar & Footer",
                                "insert_after": "homepage_cta_url",
                            },
                            {
                                "fieldname": "navbar_style",
                                "fieldtype": "Select",
                                "label": "Navbar Style",
                                "options": "Default\nPlain\nGradient",
                                "default": "Default",
                                "insert_after": "navbar_footer_section",
                                "description": "Default follows the "
                                "theme. Plain uses Navbar Color; Gradient "
                                "blends From/To.",
                            },
                            {
                                "fieldname": "navbar_color",
                                "fieldtype": "Color",
                                "label": "Navbar Color",
                                "insert_after": "navbar_style",
                                "depends_on": "eval:doc.navbar_style=="
                                "'Plain'",
                            },
                            {
                                "fieldname": "navbar_gradient_from",
                                "fieldtype": "Color",
                                "label": "Navbar Gradient From",
                                "insert_after": "navbar_color",
                                "depends_on": "eval:doc.navbar_style=="
                                "'Gradient'",
                            },
                            {
                                "fieldname": "navbar_gradient_to",
                                "fieldtype": "Color",
                                "label": "Navbar Gradient To",
                                "insert_after": "navbar_gradient_from",
                                "depends_on": "eval:doc.navbar_style=="
                                "'Gradient'",
                            },
                            {
                                "fieldname": "navbar_text",
                                "fieldtype": "Select",
                                "label": "Navbar Text",
                                "options": "Light\nDark",
                                "default": "Light",
                                "insert_after": "navbar_gradient_to",
                                "depends_on": "eval:doc.navbar_style!="
                                "'Default'",
                                "description": "Text color on the custom "
                                "navbar background.",
                            },
                            {
                                "fieldname": "contact_email",
                                "fieldtype": "Data",
                                "label": "Footer Contact Email",
                                "insert_after": "navbar_text",
                                "description": "Shown in the footer Get "
                                "in touch column.",
                            },
                            {
                                "fieldname": "footer_contact_text",
                                "fieldtype": "Small Text",
                                "label": "Footer Contact Text",
                                "insert_after": "contact_email",
                                "description": "Short line above the "
                                "contact email in the footer.",
                            },
                            {
                                "fieldname": "brand_colors_section",
                                "fieldtype": "Section Break",
                                "label": "Brand Colors",
                                "insert_after": "footer_contact_text",
                            },
                            {
                                "fieldname": "brand_primary_color",
                                "fieldtype": "Color",
                                "label": "Brand Primary Color",
                                "insert_after": "brand_colors_section",
                                "description": "Deep/dark brand color "
                                "(default #112921). Drives buttons, "
                                "gradients and dark surfaces everywhere.",
                            },
                            {
                                "fieldname": "brand_secondary_color",
                                "fieldtype": "Color",
                                "label": "Brand Secondary Color",
                                "insert_after": "brand_primary_color",
                                "description": "Lighter brand accent "
                                "(default #4D6443). Both colors together "
                                "re-theme the whole site.",
                            },
                        ]
                    }
                )
                frappe.db.commit()
                click.echo(
                    f"Website Settings on {site}: home_page = "
                    f"'{self.spa_name}', /update-password routed to the "
                    "SPA, Adi Settings tab added"
                )
            finally:
                frappe.destroy()
        except Exception as e:
            click.echo(
                f"Could not update Website Settings on {site} ({e}) — set "
                "it manually under Desk → Website Settings."
            )
