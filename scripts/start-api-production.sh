#!/bin/sh
set -eu

npx prisma migrate deploy

if [ "${DEMO_MODE_ENABLED:-false}" = "true" ]; then
  node prisma/seed.js
fi

exec node apps/api/dist/main.js
