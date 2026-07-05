# Cutover: erpnext stack → reconstructed compose

Downtime: ~30–60s while containers recreate. Run in order.

## 1. Put the compose file in place

```bash
mkdir -p /Users/santoshshunya/adiserver/frappe_docker
cp "/Users/santoshshunya/Claude/Projects/Doppio Next/infra/erpnext-compose/docker-compose.yml" /Users/santoshshunya/adiserver/frappe_docker/
```

## 2. Create + seed the shared assets volume (once)

Seeds from the old backend's assets volume, which holds the current
assets.json + symlinks:

```bash
docker volume create erpnext_assets
docker run --rm \
  -v 45e671d0fd0d7da9fd81836664a346b0e6fdb1b2ea470729845b1117f0032695:/src:ro \
  -v erpnext_assets:/dst alpine sh -c "cp -a /src/. /dst/"
```

## 3. Recreate the stack

```bash
cd /Users/santoshshunya/adiserver/frappe_docker
docker compose up -d
```

Compose recreates every service from `adimyra/erpnext-custom:2026-07-05`
(project name `erpnext` is pinned in the file, so container names stay
`erpnext-*-1` and Traefik routing keeps working).

## 4. Verify

```bash
docker compose ps                       # everything Up, nothing Restarting
docker compose logs --since 2m queue-short | tail -5   # no ModuleNotFoundError
```

Then hard-refresh https://dev.adimyra.com (styled, logs in) and confirm
background jobs: Desk → RQ Job list shows new jobs completing.

## 5. Cleanup (only after verify passes)

```bash
docker volume prune   # removes the old anonymous assets/logs volumes
```

## Operating rules from now on

- Config lives at /Users/santoshshunya/adiserver/frappe_docker/docker-compose.yml — BACK IT UP (git).
- After any `bench build` / app install inside backend:
  `docker commit erpnext-backend-1 adimyra/erpnext-custom:<date>` → bump
  `image:` in the compose → `docker compose up -d`. Otherwise workers and
  frontend drift from backend again.
- Never run heavy builds while memory is tight (Docker Desktop OOM killed
  this stack once already) — stop the doppio-next dev stack first.

## Still open (unrelated to cutover)

- is.adimyra.com DB user: CREATE USER '_a54dcead74ce2c9e'@'%' in
  mariadb-database with the password from sites/is.adimyra.com/site_config.json.
- Fix corrupted `www.ssnetwork.online` Host rule in
  /Users/santoshshunya/adiserver/traefik/dynamic.yml.
