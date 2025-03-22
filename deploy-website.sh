#!/bin/bash

# Script to deploy AverroesMind to the server
echo "🚀 Deploying AverroesMind to averroesmind.xyz..."

# Variables
SERVER_USER="ubuntu"  # Replace with your server username if different
SERVER_IP="averroesmind.xyz"  # Your server IP or domain
APP_DIR="/home/ubuntu/ai-models-zk"  # Path to your app on the server
NGINX_CONFIG="nginx-config.conf"
NGINX_TARGET="/etc/nginx/sites-available/averroesmind.xyz"

# Step 1: Push latest changes to GitHub
echo "📤 Pushing latest changes to GitHub..."
git add .
git commit -m "Update deployment configuration"
git push

# Step 2: SSH into server and pull latest changes
echo "📥 Pulling latest changes on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
  cd $APP_DIR
  git pull
  
  # Step 3: Install dependencies if needed
  echo "📦 Installing dependencies..."
  npm install
  
  # Step 4: Build the application
  echo "🔨 Building the application..."
  npm run build
  
  # Step 5: Copy Nginx configuration
  echo "🔧 Updating Nginx configuration..."
  sudo cp nginx-config.conf /etc/nginx/sites-available/averroesmind.xyz
  sudo ln -sf /etc/nginx/sites-available/averroesmind.xyz /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
  
  # Step 6: Restart the Node.js application
  echo "🔄 Restarting the Node.js application..."
  if command -v pm2 &> /dev/null; then
    pm2 restart all
  else
    echo "⚠️ PM2 not found. Installing PM2..."
    sudo npm install -g pm2
    pm2 start server.js --name "averroesmind"
    pm2 save
    pm2 startup
  fi
  
  # Step 7: Check if Ollama is running
  echo "🔍 Checking if Ollama is running..."
  if systemctl is-active --quiet ollama; then
    echo "✅ Ollama service is running"
  else
    echo "⚠️ Ollama service is not running. Starting..."
    sudo systemctl start ollama
  fi
  
  # Step 8: Verify application status
  echo "🔍 Verifying application status..."
  pm2 status
  curl -s http://localhost:3000/api/models | grep -q "models" && echo "✅ API is responding correctly" || echo "❌ API is not responding"
EOF

echo "✅ Deployment complete! Check https://averroesmind.xyz"
