# Doppio Next on Docker

A self-contained Frappe **v16** dev bench (MariaDB 11.8, Redis 7, Node 24, Python 3.14) with this repo mounted and ready to install.

## Quickstart

```bash
cd docker
docker compose up -d                 # mariadb + redis + bench container

# one-time bench + site + app setup (idempotent, safe to rerun)
docker compose exec frappe bash /workspace/doppio_next/docker/init-bench.sh

# run the bench (leave this open)
docker compose exec frappe bash -lc "cd frappe-bench && bench start"
```

Desk: http://localhost:8001 — `Administrator` / `admin`. (Host ports are shifted +1 — 8001/8081/9001 — so the dev stack never collides with production benches that own 8000/8080/9000.)

## Scaffold a Next.js frontend

In a second terminal:

```bash
docker compose exec frappe bash -lc "
  cd frappe-bench &&
  bench new-app my_app --no-git &&
  bench --site dev.localhost install-app my_app &&
  bench add-next-spa --app my_app --name shop --serving static
"

# dev server (exposed on :8080)
docker compose exec frappe bash -lc "cd frappe-bench/apps/my_app/shop && yarn dev"
```

Frontend: http://localhost:8081/shop (login with the site credentials).

## Notes

- ERPNext too? Before installing doppio_next, add: `bench get-app erpnext --branch version-16 && bench --site dev.localhost install-app erpnext` (inside the container). Give the mariadb container ≥4 GB if building many frontends — exit code 137 during builds means the container hit its memory limit.
- The repo is mounted at `/workspace/doppio_next`; after editing generator code on your host, refresh the bench copy with `bench get-app /workspace/doppio_next --overwrite` (or `pip install -e /workspace/doppio_next` into the bench env for live edits).
- Site DB users are created with host scope `%`, so container IP changes can't cause 1045 "Access denied" errors.
- Reset everything: `docker compose down -v` (deletes the bench and database volumes).
