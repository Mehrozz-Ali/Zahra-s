#!/usr/bin/env bash
# Updates the API on the EC2 server. Run from the project folder:  bash deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only
npm --prefix server ci
npm --prefix server run build
npm --prefix server run db:sync   # keeps MongoDB indexes in line with the models
pm2 startOrReload server/ecosystem.config.cjs --update-env
pm2 save
echo "Deployed. Check: curl -s http://127.0.0.1:8000/api/v1/health"
