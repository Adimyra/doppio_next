import json
import re
import shutil
import subprocess
from pathlib import Path

import click

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates_next"

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

        self.validate()

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
        self.patch_root_package_json()

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
        )

    def install_dependencies(self):
        subprocess.run(
            ["yarn", "add", "frappe-react-sdk", "socket.io-client", "motion"],
            cwd=self.spa_path,
            check=True,
        )
        # Typography plugin for rendered Blog Post HTML
        subprocess.run(
            ["yarn", "add", "-D", "@tailwindcss/typography"],
            cwd=self.spa_path,
            check=True,
        )

    def setup_shadcn(self):
        # The starter templates use Radix idioms (asChild on Button and
        # the Dropdown/Sheet triggers). shadcn CLI 4.x defaults to Base UI
        # ("base-nova" style, no asChild), so pin the Radix library.
        # Flags drift between CLI majors — try newest first:
        #   4.x:  --base radix
        #   2-3x: --base-color neutral (radix was the only library)
        attempts = [
            ["npx", "shadcn@latest", "init", "--yes", "--base", "radix"],
            ["npx", "shadcn@latest", "init", "--yes", "--base-color", "neutral"],
        ]
        for i, cmd in enumerate(attempts):
            try:
                subprocess.run(cmd, cwd=self.spa_path, check=True)
                break
            except subprocess.CalledProcessError:
                if i == len(attempts) - 1:
                    raise
        subprocess.run(
            ["npx", "shadcn@latest", "add", "--yes", "--overwrite"]
            + SHADCN_COMPONENTS,
            cwd=self.spa_path,
            check=True,
        )

    # ------------------------------------------------------------------ #
    def apply_templates(self):
        """Copy template files into the SPA, replacing placeholders."""
        for src in TEMPLATES_DIR.rglob("*"):
            if src.is_dir():
                continue

            rel = src.relative_to(TEMPLATES_DIR)

            # Variants are applied explicitly below
            if "_variants" in rel.parts:
                continue

            # Skip example pages if not wanted
            example_parts = {
                "dashboard",
                "projects",
                "portal",
                "profile",
                "admin",
                "app-header.tsx",
                "stat-card.tsx",
            }
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
                globals_css.write_text(css)

        # Serving-mode variant of next.config.ts
        if self.serving == "standalone":
            variant = TEMPLATES_DIR / "_variants" / "next.config.standalone.ts"
            content = variant.read_text()
            content = content.replace("__APP__", self.app)
            content = content.replace("__SPA__", self.spa_name)
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
            subprocess.run(["npm", "init", "--yes"], cwd=self.app_path, check=True)

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
