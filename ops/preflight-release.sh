#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "[1/5] Lint"
npm run lint

echo "[2/5] Build"
npm run build

echo "[3/5] Backend tests"
npm run test -w backend

echo "[4/5] Frontend tests"
npx tsx --test frontend/tests/**/*.test.ts

echo "[5/5] Security audit (prod deps)"
npm audit --omit=dev --audit-level=high

echo "Preflight completato con successo."
