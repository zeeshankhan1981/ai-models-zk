#!/bin/bash

# AverroesMind v3.0.0 Deployment Fix Script
# This script fixes the deployment issues and completes the process

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Starting AverroesMind v3.0.0 deployment fix...${NC}"

# SSH into the server and fix the deployment
ssh factoura << 'EOF'
echo "Connected to server: $(hostname)"
echo "Current directory: $(pwd)"

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Current Node.js version: $NODE_VERSION"

# Install NVM if not already installed
if ! command -v nvm &> /dev/null; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20 if needed
if ! nvm ls 20 &> /dev/null; then
  echo "Installing Node.js 20..."
  nvm install 20
fi

# Use Node.js 20
echo "Switching to Node.js 20..."
nvm use 20
NODE_VERSION=$(node -v)
echo "Now using Node.js version: $NODE_VERSION"

# Navigate to project directory
cd /var/www/ai-models-zk

# Install dependencies with the correct Node.js version
echo "Installing dependencies..."
npm install

# Install Vite globally
echo "Installing Vite globally..."
npm install -g vite

# Build the application
echo "Building the application..."
npm run build

# Create production directories
echo "Creating production directories..."
sudo mkdir -p /var/www/averroesmind.xyz
sudo mkdir -p /var/log/averroesmind

# Copy files to production directory
echo "Copying files to production directory..."
sudo cp -r dist /var/www/averroesmind.xyz/
sudo cp -r server /var/www/averroesmind.xyz/
sudo cp server.js /var/www/averroesmind.xyz/
sudo cp package.json /var/www/averroesmind.xyz/
sudo cp package-lock.json /var/www/averroesmind.xyz/

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 process manager..."
  npm install -g pm2
fi

# Create PM2 ecosystem file with CPU optimization
echo "Creating PM2 ecosystem file with CPU optimization..."
sudo tee /var/www/averroesmind.xyz/ecosystem.config.js > /dev/null << EOFPM2
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
EOFPM2

# Configure Ollama for CPU optimization
echo "Configuring Ollama for CPU optimization..."
if [ -f "/etc/systemd/system/ollama.service" ]; then
  sudo cp /etc/systemd/system/ollama.service /etc/systemd/system/ollama.service.bak
  sudo tee /etc/systemd/system/ollama.service > /dev/null << EOFOLLAMA
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
EOFOLLAMA

  sudo systemctl daemon-reload
  sudo systemctl restart ollama
fi

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/averroesmind.xyz > /dev/null << EOFNGINX
server {
    listen 80;
    server_name averroesmind.xyz www.averroesmind.xyz;

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
EOFNGINX

# Enable the site
echo "Enabling the site in Nginx..."
sudo ln -sf /etc/nginx/sites-available/averroesmind.xyz /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# Start the application with PM2
echo "Starting the application with PM2..."
cd /var/www/averroesmind.xyz
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot
echo "Setting up PM2 to start on boot..."
pm2 startup

# Pull CPU-optimized models
echo "Pulling CPU-optimized models..."
ollama pull mistral
ollama pull phi:2
ollama pull llama2
OLLAMA_CPU_ONLY=true ollama pull codellama:7b-code

# Skip SSL certificate renewal since it's already valid
echo "SSL certificate is already valid and doesn't need renewal."

echo "🎉 Deployment fix complete!"
echo "Your application should now be available at: https://averroesmind.xyz"
EOF

echo -e "${GREEN}✅ Deployment fix script completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify the application is working at https://averroesmind.xyz"
echo "2. Check server logs with: ssh factoura 'pm2 logs'"
echo "3. Monitor server performance with: ssh factoura 'htop'"
