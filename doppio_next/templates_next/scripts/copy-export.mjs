/**
 * Copies the Next.js static export (out/) into the host Frappe app:
 *
 *   out/_next, images, fonts, ...  →  ../__APP__/public/__SPA__/   (served at /assets/__APP__/__SPA__/)
 *   out/index.html                 →  ../__APP__/www/__SPA__.html  (served at /__SPA__)
 *   out/<page>.html                →  ../__APP__/www/__SPA__/<page>.html (served at /__SPA__/<page>)
 *
 * A CSRF bootstrap script is injected into every HTML entry. Frappe
 * renders www/*.html through Jinja, so `{{ frappe.session.csrf_token }}`
 * resolves at request time.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const APP = "__APP__";
const SPA = "__SPA__";
const OUT = "out";

const publicDir = path.join("..", APP, "public", SPA);
const wwwDir = path.join("..", APP, "www", SPA);
const wwwEntry = path.join("..", APP, "www", `${SPA}.html`);

const CSRF_SNIPPET =
  "<script>window.csrf_token = '{{ frappe.session.csrf_token }}';</script>";

if (!existsSync(OUT)) {
  console.error(`"${OUT}" not found — run \`next build\` first.`);
  process.exit(1);
}

// Clean previous build output
for (const target of [publicDir, wwwDir, wwwEntry]) {
  rmSync(target, { recursive: true, force: true });
}
mkdirSync(publicDir, { recursive: true });
mkdirSync(wwwDir, { recursive: true });

function injectCsrf(html) {
  if (html.includes("</head>")) {
    return html.replace("</head>", `${CSRF_SNIPPET}</head>`);
  }
  return CSRF_SNIPPET + html;
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(OUT, full);

    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }

    if (full.endsWith(".html")) {
      const html = injectCsrf(readFileSync(full, "utf8"));

      if (rel === "index.html") {
        writeFileSync(wwwEntry, html);
      } else {
        const dest = path.join(wwwDir, rel);
        mkdirSync(path.dirname(dest), { recursive: true });
        writeFileSync(dest, html);
      }
    } else {
      // Static asset → app public dir (includes _next/, .txt RSC payloads, etc.)
      const dest = path.join(publicDir, rel);
      mkdirSync(path.dirname(dest), { recursive: true });
      cpSync(full, dest);
    }
  }
}

walk(OUT);

console.log(`✓ assets  → ${publicDir}`);
console.log(`✓ entry   → ${wwwEntry}`);
console.log(`✓ pages   → ${wwwDir}`);
console.log(`\nRun \`bench build --app ${APP}\` / restart bench, then open /${SPA}`);
