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

# Create PM2 ecosystem file with CPU optimization
echo "⚙️ Creating PM2 ecosystem file with CPU optimization..."
cat > /var/www/$DOMAIN/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: "averroesmind",
    script: "server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "48G",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      OLLAMA_HOST: "0.0.0.0",
      OLLAMA_NUM_THREADS: "14",
      OLLAMA_NUM_CPU: "16",
      OLLAMA_CPU_ONLY: "true"
    },
    node_args: "--max-old-space-size=8192"
  }]
};
EOF

# Configure Ollama for CPU optimization
echo "⚙️ Configuring Ollama for CPU optimization..."
if [ -f "/etc/systemd/system/ollama.service" ]; then
  sudo cp /etc/systemd/system/ollama.service /etc/systemd/system/ollama.service.bak
  sudo tee /etc/systemd/system/ollama.service > /dev/null << EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_NUM_THREADS=14"
Environment="OLLAMA_NUM_CPU=16"
Environment="OLLAMA_CPU_ONLY=true"
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=default.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl restart ollama
fi

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
        
        # Increase timeouts for long-running requests
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
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

# Pull CPU-optimized models
echo "📦 Pulling CPU-optimized models..."
ollama pull mistral
ollama pull phi:2
ollama pull llama2
OLLAMA_CPU_ONLY=true ollama pull codellama:7b-code

echo "🎉 Deployment complete!"
echo "📝 Next steps:"
echo "1. Set up SSL with Let's Encrypt using: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "2. Make sure your DNS is configured to point to this server"
echo "3. Monitor system performance with: htop"
echo "4. Check Ollama logs with: journalctl -u ollama -f"

# Print access information
echo "🌐 Your application will be available at: http://$DOMAIN"
echo "   After setting up SSL: https://$DOMAIN"
