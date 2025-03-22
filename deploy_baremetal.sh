#!/bin/bash

# AverroesMind Baremetal Deployment Script
# This script deploys AverroesMind to a baremetal server with AMD Ryzen 7 and 64GB RAM

# Exit on any error
set -e

echo "🚀 Starting AverroesMind deployment process on baremetal server..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Check if domain is provided
if [ -z "$1" ]; then
  DOMAIN="averroesmind.xyz"
else
  DOMAIN=$1
fi

echo "📝 Deploying to domain: $DOMAIN"

# Install required dependencies
echo "📦 Installing required dependencies..."
apt update
apt install -y nginx certbot python3-certbot-nginx nodejs npm curl git htop

# Check Node.js version and install newer version if needed
NODE_VERSION=$(node -v 2>/dev/null | cut -d 'v' -f 2 || echo "0.0.0")
if [ "$(printf '%s\n' "14.0.0" "$NODE_VERSION" | sort -V | head -n1)" = "14.0.0" ]; then
  echo "✅ Node.js version $NODE_VERSION is sufficient"
else
  echo "📦 Installing newer version of Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt install -y nodejs
fi

# Install Ollama if not already installed
if ! command -v ollama &> /dev/null; then
  echo "📦 Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
  
  # Configure Ollama for CPU optimization
  echo "⚙️ Configuring Ollama for CPU optimization..."
  cat > /etc/systemd/system/ollama.service << EOF
[Unit]
Description=Ollama Service
After=network-online.target
Wants=network-online.target

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

  systemctl daemon-reload
  systemctl enable ollama
  systemctl start ollama
  
  # Wait for Ollama to start
  echo "⏳ Waiting for Ollama to start..."
  sleep 10
fi

# Clone the repository if not already cloned
REPO_DIR="/var/www/$DOMAIN"
if [ ! -d "$REPO_DIR" ]; then
  echo "📥 Cloning repository..."
  mkdir -p /var/www
  git clone https://github.com/zeeshankhan1981/ai-models-zk.git $REPO_DIR
else
  echo "📂 Repository already exists, updating..."
  cd $REPO_DIR
  git pull
fi

# Create log directory
mkdir -p /var/log/averroesmind

# Navigate to the repository
cd $REPO_DIR

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build the application
echo "🏗️ Building the application..."
npx vite build

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2 process manager..."
  npm install -g pm2
fi

# Create PM2 ecosystem file with CPU optimization
echo "⚙️ Creating PM2 ecosystem file with CPU optimization..."
cat > $REPO_DIR/ecosystem.config.js << EOF
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

# Create Nginx sites-enabled directory if it doesn't exist
mkdir -p /etc/nginx/sites-enabled

# Enable the site
echo "🔌 Enabling the site in Nginx..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remove default Nginx site if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
  rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl restart nginx

# Start the application with PM2
echo "🚀 Starting the application with PM2..."
cd $REPO_DIR
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

# Create CPU-optimized models
echo "📦 Creating CPU-optimized models..."
cd $REPO_DIR
mkdir -p modelfiles

# Create Modelfiles
cat > modelfiles/Mistral << EOF
FROM mistral
PARAMETER num_ctx 2048
PARAMETER num_thread 14
PARAMETER num_batch 512
PARAMETER cpu_only true
EOF

cat > modelfiles/Phi << EOF
FROM phi:2
PARAMETER num_ctx 2048
PARAMETER num_thread 14
PARAMETER num_batch 512
PARAMETER cpu_only true
EOF

cat > modelfiles/Codellama << EOF
FROM codellama:7b-code
PARAMETER num_ctx 2048
PARAMETER num_thread 14
PARAMETER num_batch 512
PARAMETER cpu_only true
EOF

# Create optimized models
ollama create mistral-cpu -f modelfiles/Mistral
ollama create phi-cpu -f modelfiles/Phi
ollama create codellama-cpu -f modelfiles/Codellama

# Ask for email for SSL certificates
read -p "Enter your email for SSL certificate notifications: " EMAIL
if [ -z "$EMAIL" ]; then
  EMAIL="admin@$DOMAIN"
  echo "Using default email: $EMAIL"
fi

# Set up SSL with Let's Encrypt
echo "🔒 Setting up SSL with Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

echo "🎉 Deployment complete!"
echo "🌐 Your application is now available at: https://$DOMAIN"
echo ""
echo "📝 Next steps:"
echo "1. Monitor system performance with: htop"
echo "2. Check Ollama logs with: journalctl -u ollama -f"
echo "3. Check application logs with: pm2 logs averroesmind"
echo ""
echo "🔄 To restart the application: pm2 restart averroesmind"
echo "🔄 To restart Nginx: systemctl restart nginx"
echo "🔄 To restart Ollama: systemctl restart ollama"
