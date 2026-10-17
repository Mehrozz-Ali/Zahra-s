#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 22.04/24.04 EC2 instance. Read it first, then run:  bash deploy/ec2-setup.sh
set -euo pipefail

sudo apt-get update
sudo apt-get install -y nginx git curl ufw certbot python3-certbot-nginx

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Firewall: SSH and web only. The API port (8000) stays closed to the internet; nginx reaches it locally.
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw --force enable

# Start PM2 again after a reboot
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 | bash

echo "Next: clone the project, create server/.env, then see 'Deployment' in README.md"
