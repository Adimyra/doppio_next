import click

from .next_generator import NextSPAGenerator


@click.command("add-next-spa")
@click.option("--name", default="frontend", prompt="Frontend Name")
@click.option("--app", prompt="App Name")
@click.option(
    "--no-example",
    default=False,
    is_flag=True,
    help="Skip the example dashboard page",
)
@click.option(
    "--serving",
    type=click.Choice(["static", "standalone"]),
    default="static",
    prompt="Serving mode",
    help="static: exported into the app's public/ and www/, served by Frappe. "
    "standalone: Node server with full SSR/API routes (needs nginx routing).",
)
def add_next_spa(name, app, no_example, serving):
    """Scaffold a Next.js (TypeScript + Tailwind v4 + shadcn/ui) SPA
    inside a Frappe app and wire it to the Frappe backend."""
    if not app:
        click.echo("Please provide an app with --app")
        return

    generator = NextSPAGenerator(
        spa_name=name, app=app, with_example=not no_example, serving=serving
    )
    generator.generate()


commands = [add_next_spa]
