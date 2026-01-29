#!/bin/bash

# Academy DSJ Chat App - Production Setup Script
# Version: 1.0.6

set -e

echo "=========================================="
echo "Academy DSJ Chat App - Production Setup"
echo "Version: 1.0.6"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

PROJECT_DIR="/var/www/academydsj-chatapp"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo ""
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
apt-get update
apt-get install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx nodejs npm

# Install Node.js 20 if not already installed
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 18 ]]; then
    echo -e "${YELLOW}Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo ""
echo -e "${YELLOW}Step 2: Setting up PostgreSQL database...${NC}"
# Create database and user
sudo -u postgres psql <<EOF
CREATE USER academydsj WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE academydsj_chat OWNER academydsj;
GRANT ALL PRIVILEGES ON DATABASE academydsj_chat TO academydsj;
\c academydsj_chat
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOF
echo -e "${GREEN}Database created!${NC}"

echo ""
echo -e "${YELLOW}Step 3: Installing npm packages...${NC}"
cd "$PROJECT_DIR"
npm install

cd "$PROJECT_DIR/server"
npm install

echo ""
echo -e "${YELLOW}Step 4: Setting up environment files...${NC}"
# Copy production env files if .env doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env.production" "$PROJECT_DIR/.env"
    echo -e "${YELLOW}Please update $PROJECT_DIR/.env with your settings${NC}"
fi

if [ ! -f "$PROJECT_DIR/server/.env" ]; then
    cp "$PROJECT_DIR/server/.env.production" "$PROJECT_DIR/server/.env"
    echo -e "${YELLOW}Please update $PROJECT_DIR/server/.env with your database password and JWT secret${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Building frontend...${NC}"
cd "$PROJECT_DIR"
npm run build:web

echo ""
echo -e "${YELLOW}Step 6: Setting up Nginx...${NC}"
# Copy nginx configs
cp "$PROJECT_DIR/nginx/chat-api.academydsj.com.conf" "$NGINX_AVAILABLE/"
cp "$PROJECT_DIR/nginx/chat.academydsj.com.conf" "$NGINX_AVAILABLE/"

# Create symlinks if they don't exist
ln -sf "$NGINX_AVAILABLE/chat-api.academydsj.com.conf" "$NGINX_ENABLED/"
ln -sf "$NGINX_AVAILABLE/chat.academydsj.com.conf" "$NGINX_ENABLED/"

# Test nginx config
nginx -t

echo ""
echo -e "${YELLOW}Step 7: Setting up SSL with Certbot...${NC}"
echo -e "${YELLOW}Make sure your DNS records point to this server first!${NC}"
echo ""
read -p "Domain chat-api.academydsj.com DNS configured? (y/n): " dns1
read -p "Domain chat.academydsj.com DNS configured? (y/n): " dns2

if [[ "$dns1" == "y" && "$dns2" == "y" ]]; then
    certbot --nginx -d chat-api.academydsj.com -d chat.academydsj.com
else
    echo -e "${YELLOW}Skipping SSL setup. Run these commands after DNS is configured:${NC}"
    echo "  certbot --nginx -d chat-api.academydsj.com"
    echo "  certbot --nginx -d chat.academydsj.com"
fi

echo ""
echo -e "${YELLOW}Step 8: Setting up systemd service...${NC}"
cp "$PROJECT_DIR/nginx/academydsj-chat-api.service" /etc/systemd/system/

# Create uploads directory
mkdir -p "$PROJECT_DIR/server/uploads"
chown -R www-data:www-data "$PROJECT_DIR"

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable academydsj-chat-api
systemctl start academydsj-chat-api

# Reload nginx
systemctl reload nginx

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "URLs:"
echo "  Web App: https://chat.academydsj.com"
echo "  API: https://chat-api.academydsj.com"
echo ""
echo "Commands:"
echo "  Check API status: systemctl status academydsj-chat-api"
echo "  View API logs: journalctl -u academydsj-chat-api -f"
echo "  Restart API: systemctl restart academydsj-chat-api"
echo ""
echo -e "${YELLOW}IMPORTANT: Update these files with your actual credentials:${NC}"
echo "  - $PROJECT_DIR/server/.env (DATABASE_URL, JWT_SECRET)"
echo "  - PostgreSQL password (run: sudo -u postgres psql)"
echo ""
