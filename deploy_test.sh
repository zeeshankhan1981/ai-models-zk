#!/bin/bash

# Exit on error
set -e

# Server details
SERVER_USER="zeeshankhan"
SERVER_ALIAS="factoura"
DEPLOY_DIR="/home/$SERVER_USER/ai-models-zk-test"

# Print status function
print_status() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

# Error function
print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
    exit 1
}

# Create deployment directory
print_status "Creating deployment directory..."
ssh $SERVER_USER@$SERVER_ALIAS "mkdir -p $DEPLOY_DIR"

# Copy project files
print_status "Copying project files..."
rsync -avz --progress . $SERVER_USER@$SERVER_ALIAS:$DEPLOY_DIR --exclude node_modules --exclude .git

# Install dependencies
print_status "Installing dependencies..."
ssh $SERVER_USER@$SERVER_ALIAS "cd $DEPLOY_DIR && npm install"

# Configure PM2
print_status "Setting up PM2..."
ssh $SERVER_USER@$SERVER_ALIAS "cd $DEPLOY_DIR && pm2 start server.js --name averroesmind-test"

# Pull required models
print_status "Pulling required models..."
ssh $SERVER_USER@$SERVER_ALIAS "ollama pull mistral && ollama pull deepseek && ollama pull starcoder2 && ollama pull zephyr && ollama pull phi2 && ollama pull metamath"

# Configure PM2 ecosystem file
print_status "Setting up PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'averroesmind-test',
    script: 'server.js',
    args: '',
    watch: false,
    max_memory_restart: '48G',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      API_PORT: '3001',
      OLLAMA_URL: 'http://localhost:11434',
    },
  }],
};
EOL

ssh $SERVER_USER@$SERVER_ALIAS "cd $DEPLOY_DIR && pm2 start ecosystem.config.js"

print_status "Deployment complete! Access the application at http://$SERVER_ALIAS:3000"
