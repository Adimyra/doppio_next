#!/usr/bin/env bash
# One-time bench setup inside the `frappe` container.
# Run: docker compose exec frappe bash /workspace/doppio_next/docker/init-bench.sh
set -euo pipefail

SITE="${SITE:-dev.localhost}"
BRANCH="${BRANCH:-version-16}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"

echo "==> Node 24 (Frappe v16 parity)"
source "$HOME/.nvm/nvm.sh" 2>/dev/null || true
nvm install 24 && nvm alias default 24 && nvm use 24
npm install -g yarn >/dev/null 2>&1 || true

if [ ! -d "$HOME/frappe-bench" ]; then
  echo "==> bench init ($BRANCH)"
  PY_FLAG=""
  command -v python3.14 >/dev/null 2>&1 && PY_FLAG="--python python3.14"
  bench init --skip-redis-config-generation --frappe-branch "$BRANCH" $PY_FLAG "$HOME/frappe-bench"
fi
cd "$HOME/frappe-bench"

echo "==> point bench at compose services"
bench set-config -g db_host mariadb
bench set-config -g redis_cache    "redis://redis-cache:6379"
bench set-config -g redis_queue    "redis://redis-queue:6379"
bench set-config -g redis_socketio "redis://redis-queue:6379"

if [ ! -d "sites/$SITE" ]; then
  echo "==> new site $SITE"
  # --mariadb-user-host-login-scope='%' avoids host-bound grants that break
  # when container IPs change (the classic 1045 Access denied failure mode)
  bench new-site "$SITE" \
    --db-root-password "$DB_ROOT_PASSWORD" \
    --admin-password "$ADMIN_PASSWORD" \
    --mariadb-user-host-login-scope='%'
  bench set-config -g default_site "$SITE"
fi

echo "==> install doppio_next"
[ -d "apps/doppio_next" ] || bench get-app /workspace/doppio_next
bench --site "$SITE" install-app doppio_next || true

cat <<EOF

✅ Bench ready.

Start it:            bench start
Desk:                http://localhost:8000  (Administrator / $ADMIN_PASSWORD)

Scaffold a frontend (needs a host app; create one if you don't have it):
  bench new-app my_app && bench --site $SITE install-app my_app
  bench add-next-spa --app my_app --name shop --serving static
  cd apps/my_app/shop && yarn dev        # http://localhost:8080/shop

EOF
