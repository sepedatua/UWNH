# Production Deployment Guide: Hetzner Cloud VPS (Debian 13 + Virtualmin)

This guide walks you through deploying **Uncharted Waters: New Horizons Web Remake** onto a Hetzner Cloud VPS running Debian 13 (Trixie) or Ubuntu 24.04 LTS with Virtualmin LAMP.

---

## Architecture Overview
- **Zero Paid Cloud Services:** Self-hosted on your Hetzner VPS.
- **Frontend:** Pre-rendered HTML5 Canvas + React 18 + Vite (static assets cached 1 year).
- **Backend:** Modular PHP 8.2+ REST API with PDO MySQL connection pool.
- **Database:** MariaDB 10.11+ / 11.x database `uncharted_waters`.
- **Protocol:** HTTP/2 over TLS with Let's Encrypt certificates. **Strictly NO WebSockets required** (REST polling only).

---

## Quick Deployment in 3 Steps

### Step 1: Clone Repository to Hetzner VPS
```bash
cd /var/www
git clone https://github.com/your-username/uncharted-waters-remake.git
cd uncharted-waters-remake
```

### Step 2: Provision MariaDB Database
Run the automated database setup script:
```bash
chmod +x deploy/setup_database.sh
sudo ./deploy/setup_database.sh
```
The script will output the generated credentials. Ensure `server/config.php` matches your database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'uncharted_waters');
define('DB_USER', 'uncharted_user');
define('DB_PASS', '<your-generated-password>');
define('DB_PORT', '3306');
```

### Step 3: Run Automated Deployment
```bash
chmod +x deploy/deploy.sh
sudo ./deploy/deploy.sh /home/uncharted/public_html
```
This script automatically:
1. Installs npm dependencies and compiles the optimized production Vite bundle.
2. Synchronizes static build assets into your Virtualmin web directory `/home/uncharted/public_html`.
3. Installs the PHP API backend into `/home/uncharted/public_html/server`.
4. Deploys `.htaccess` with immutable caching headers for WASM, OGG, and WebP assets.
5. Applies correct Linux permissions (`chmod 755/644`).
6. Executes local API health checks.

---

## Web Server Configuration

### Option A: Apache 2.4+ (Virtualmin Default)
1. In Virtualmin, navigate to **Server Configuration** -> **Edit Directives**.
2. Paste the contents of `deploy/virtualmin-apache.conf` into your VirtualHost definition.
3. Ensure required Apache modules are enabled:
```bash
sudo a2enmod rewrite headers expires deflate ssl http2
sudo systemctl restart apache2
```

### Option B: Nginx Standalone
1. Copy `deploy/virtualmin-nginx.conf` to `/etc/nginx/sites-available/uncharted.conf`.
2. Link to sites-enabled:
```bash
sudo ln -s /etc/nginx/sites-available/uncharted.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Verifying the Live Deployment
1. **Frontend:** Open `https://uncharted.yourdomain.com` in your browser. Verify Lisbon renders smoothly with WASM tilemaps and Yoko Kanno audio playing.
2. **REST API Health:**
```bash
curl -i https://uncharted.yourdomain.com/server/mp/ports.php?port_id=1
```
Expected response: HTTP 200 with `{"success": true, "port": {"port_id": 1, "port_name": "Lisbon", ...}}`.
3. **Multiplayer Living World:**
Visit `https://uncharted.yourdomain.com/server/mp/influence.php` to verify real-time national port control calculation across all 6 seafaring nations.
