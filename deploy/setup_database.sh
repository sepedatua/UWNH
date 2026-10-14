#!/usr/bin/env bash
# ==============================================================================
# Uncharted Waters: New Horizons — MariaDB Production Provisioning Script
# Target: Debian 13 (Trixie) / Ubuntu 24.04 LTS on Hetzner Cloud VPS
# ==============================================================================

set -euo pipefail

DB_NAME="uncharted_waters"
DB_USER="uncharted_user"
DB_PASS="$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)"
SCHEMA_FILE="$(dirname "$0")/../database/schema.sql"

echo "=================================================="
echo "⚓ UNCHARTED WATERS: NEW HORIZONS — DATABASE SETUP"
echo "=================================================="

# Check if mariadb/mysql command is available
if ! command -v mysql &> /dev/null; then
    echo "❌ Error: mysql client not found. Please install mariadb-server: apt-get install mariadb-server"
    exit 1
fi

echo "📦 Creating MariaDB database and user..."

mariadb -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database '${DB_NAME}' and user '${DB_USER}' created."

if [ -f "${SCHEMA_FILE}" ]; then
    echo "📋 Importing schema from ${SCHEMA_FILE}..."
    mariadb -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${SCHEMA_FILE}"
    echo "✅ Schema successfully applied."
else
    echo "⚠️ Warning: Schema file not found at ${SCHEMA_FILE}."
fi

echo ""
echo "=================================================="
echo "🎉 MARIADB SETUP COMPLETE!"
echo "=================================================="
echo "Database: ${DB_NAME}"
echo "User:     ${DB_USER}"
echo "Password: ${DB_PASS}"
echo ""
echo "👉 Update server/config.php with these credentials:"
echo "define('DB_NAME', '${DB_NAME}');"
echo "define('DB_USER', '${DB_USER}');"
echo "define('DB_PASS', '${DB_PASS}');"
echo "=================================================="
