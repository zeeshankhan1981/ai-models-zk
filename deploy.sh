#!/bin/bash

# AverroesMind Deployment Script
# This script helps deploy AverroesMind to a production server

# Exit on any error
set -e

echo "🚀 Starting AverroesMind deployment process..."

# Check if domain is provided
if [ -z "$1" ]; then
  DOMAIN="averroesmind.xyz"
else
  DOMAIN=$1
fi

echo "📝 Deploying to domain: $DOMAIN"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🏗️ Building the application..."
npm run build

# Create production directories
echo "📁 Creating production directories..."
mkdir -p /var/www/$DOMAIN
mkdir -p /var/log/averroesmind

# Copy files to production directory
echo "📋 Copying files to production directory..."
cp -r dist /var/www/$DOMAIN/
cp -r server /var/www/$DOMAIN/
cp server.js /var/www/$DOMAIN/
cp package.json /var/www/$DOMAIN/
cp package-lock.json /var/www/$DOMAIN/

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2 process manager..."
  npm install -g pm2
fi

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 ecosystem file..."
cat > /var/www/$DOMAIN/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "averroesmind",
    script: "server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
EOF

# Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
echo "🔌 Enabling the site in Nginx..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Start the application with PM2
echo "🚀 Starting the application with PM2..."
cd /var/www/$DOMAIN
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot
echo "⚙️ Setting up PM2 to start on boot..."
pm2 startup

echo "🎉 Deployment complete!"
echo "📝 Next steps:"
echo "1. Set up SSL with Let's Encrypt using: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "2. Make sure your DNS is configured to point to this server"
echo "3. Ensure Ollama is installed and running on the server"
echo "4. Pull the required models using: ollama pull <model_name>"

# Print access information
echo "🌐 Your application will be available at: http://$DOMAIN"
echo "   After setting up SSL: https://$DOMAIN"
