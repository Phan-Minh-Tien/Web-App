#!/usr/bin/env bash
set -e

cd /var/www/hoanggia/backend
npm install --production
pm2 restart hoanggia-app || pm2 start server.js --name hoanggia-app
