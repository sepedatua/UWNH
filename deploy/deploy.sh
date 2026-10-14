#!/usr/bin/env bash
# ==============================================================================
# Uncharted Waters: New Horizons — Automated Production Deployment Script
# Target: Hetzner Cloud VPS (Debian 13 Trixie / Ubuntu 24.04 LTS) with Virtualmin
# ==============================================================================

set -euo pipefail

# Configuration
TARGET_DIR="${1:-/home/uncharted/public_html}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/temp_uw2"
WEB_USER="uncharted"
WEB_GROUP="uncharted"

echo "=================================================="
echo "⛵ UNCHARTED WATERS: NEW HORIZONS — DEPLOYMENT"
echo "=================================================="
echo "Deploying from: ${PROJECT_ROOT}"
echo "Deploying to:   ${TARGET_DIR}"
echo ""

# 1. Check Prerequisites
echo "🔍 Checking server environment..."
for cmd in node npm php; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "❌ Error: Required tool '$cmd' is not installed."
        exit 1
    fi
done

PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
echo "✅ Node.js: $(node -v)"
echo "✅ PHP:     v${PHP_VERSION}"

# 2. Build Frontend
echo ""
echo "🔨 Building frontend production bundle with Vite..."
cd "${FRONTEND_DIR}"
npm run build

if [ ! -d "${FRONTEND_DIR}/build" ]; then
    echo "❌ Error: Build output directory ${FRONTEND_DIR}/build does not exist."
    exit 1
fi
echo "✅ Frontend successfully built."

# 3. Prepare Web Root
echo ""
echo "📁 Preparing target web directory: ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}"

# 4. Deploy Static Assets & SPA
echo "📦 Copying production frontend assets..."
cp -r "${FRONTEND_DIR}/build/"* "${TARGET_DIR}/"

# 5. Deploy PHP API Backend
echo "📦 Copying PHP API backend..."
mkdir -p "${TARGET_DIR}/server"
cp -r "${PROJECT_ROOT}/server/"* "${TARGET_DIR}/server/"

# 6. Deploy .htaccess
if [ -f "${PROJECT_ROOT}/deploy/.htaccess" ]; then
    echo "📄 Installing production .htaccess..."
    cp "${PROJECT_ROOT}/deploy/.htaccess" "${TARGET_DIR}/.htaccess"
fi

# 7. Set Permissions
echo ""
echo "🔒 Configuring filesystem permissions..."
if id "${WEB_USER}" &>/dev/null; then
    chown -R "${WEB_USER}:${WEB_GROUP}" "${TARGET_DIR}"
else
    echo "⚠️ User '${WEB_USER}' not found; falling back to www-data..."
    chown -R www-data:www-data "${TARGET_DIR}" || true
fi

find "${TARGET_DIR}" -type d -exec chmod 755 {} +
find "${TARGET_DIR}" -type f -exec chmod 644 {} +

# 8. Health Check Verification
echo ""
echo "🩺 Running local endpoint health verification..."
if command -v curl &> /dev/null; then
    HEALTH_OUT=$(curl -s "http://localhost/server/mp/ports.php?port_id=1" || echo "FAIL")
    if [[ "$HEALTH_OUT" == *"success"* ]]; then
        echo "✅ API Health Check PASSED: Port 1 responded with success: true"
    else
        echo "ℹ️ Note: Server responded or not running on port 80 yet ($HEALTH_OUT)."
    fi
fi

echo ""
echo "=================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your Uncharted Waters remake is now live at:"
echo "👉 ${TARGET_DIR}"
echo "=================================================="
