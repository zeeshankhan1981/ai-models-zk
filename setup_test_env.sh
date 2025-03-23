#!/bin/bash

# Exit on error
set -e

# Server details
SERVER_HOST="factoura"
DEV_DIR="/opt/averroesmind-dev"
TEST_DIR="/opt/averroesmind-test"

# Print status function
print_status() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

# Error function
print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
    exit 1
}

# Update system and install Node.js
print_status "Updating system and installing Node.js..."
ssh $SERVER_HOST "apt update && apt install -y nodejs npm"

# Download LLM models
print_status "Downloading LLM models..."
ssh $SERVER_HOST "ollama pull mistral:latest"
ssh $SERVER_HOST "ollama pull deepseek:latest"
ssh $SERVER_HOST "ollama pull starcoder2:latest"
ssh $SERVER_HOST "ollama pull zephyr-7b:latest"
ssh $SERVER_HOST "ollama pull metamath:latest"
ssh $SERVER_HOST "ollama pull phi-2:latest"
ssh $SERVER_HOST "ollama pull llama2:latest"
ssh $SERVER_HOST "ollama pull llama3:latest"
ssh $SERVER_HOST "ollama pull gemma:2b"

# Ensure directories exist
print_status "Ensuring directories exist..."
ssh $SERVER_HOST "mkdir -p $DEV_DIR $TEST_DIR"

# Clone repository if needed
print_status "Cloning repository..."
ssh $SERVER_HOST "cd /opt && git clone https://github.com/zeeshankhan1981/ai-models-zk.git averroesmind-dev 2>/dev/null || true"

# Copy to test directory
print_status "Copying to test directory..."
ssh $SERVER_HOST "cp -r $DEV_DIR/* $TEST_DIR/"

# Set up .env files
print_status "Setting up .env files..."

# Dev .env
ssh $SERVER_HOST "cat > $DEV_DIR/.env << 'EOL'
PORT=3002
API_PORT=3002
OLLAMA_URL=http://localhost:11434
NODE_ENV=development
EOL"

# Test .env
ssh $SERVER_HOST "cat > $TEST_DIR/.env << 'EOL'
PORT=3003
API_PORT=3003
OLLAMA_URL=http://localhost:11434
NODE_ENV=staging
EOL"

# Install global dependencies
print_status "Installing global dependencies..."
ssh $SERVER_HOST "npm install -g pm2 --unsafe-perm"

# Install dependencies
print_status "Installing dependencies..."
ssh $SERVER_HOST "cd $DEV_DIR && npm install"
ssh $SERVER_HOST "cd $TEST_DIR && npm install"

# Set up PM2
print_status "Setting up PM2..."
ssh $SERVER_HOST "pm2 install pm2-logrotate"

# Create PM2 ecosystem files
print_status "Creating PM2 ecosystem files..."

# Dev ecosystem
ssh $SERVER_HOST "cat > $DEV_DIR/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'averroesmind-dev-backend',
    script: 'server.js',
    args: '',
    watch: false,
    max_memory_restart: '48G',
    env: {
      NODE_ENV: 'development',
      PORT: '3002',
      API_PORT: '3002',
      OLLAMA_URL: 'http://localhost:11434',
    },
  }, {
    name: 'averroesmind-dev-frontend',
    script: 'npm',
    args: 'run dev',
    watch: false,
    max_memory_restart: '8G',
    env: {
      NODE_ENV: 'development',
      PORT: '5174'
    }
  }]
};
EOL"

# Test ecosystem
ssh $SERVER_HOST "cat > $TEST_DIR/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'averroesmind-test-backend',
    script: 'server.js',
    args: '',
    watch: false,
    max_memory_restart: '48G',
    env: {
      NODE_ENV: 'staging',
      PORT: '3003',
      API_PORT: '3003',
      OLLAMA_URL: 'http://localhost:11434',
    },
  }, {
    name: 'averroesmind-test-frontend',
    script: 'npm',
    args: 'run dev',
    watch: false,
    max_memory_restart: '8G',
    env: {
      NODE_ENV: 'staging',
      PORT: '5175'
    }
  }]
};
EOL"

# Start Dev environment
print_status "Starting Dev environment..."
ssh $SERVER_HOST "cd $DEV_DIR && pm2 start ecosystem.config.js"

# Start Test environment
print_status "Starting Test environment..."
ssh $SERVER_HOST "cd $TEST_DIR && pm2 start ecosystem.config.js"

# Configure Nginx
print_status "Setting up Nginx configuration..."

# Create Dev config
ssh $SERVER_HOST "cat > /etc/nginx/sites-available/dev.averroesmind.xyz << 'EOL'
server {
    listen 80;
    server_name dev.averroesmind.xyz;

    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOL"

# Create Test config
ssh $SERVER_HOST "cat > /etc/nginx/sites-available/test.averroesmind.xyz << 'EOL'
server {
    listen 80;
    server_name test.averroesmind.xyz;

    location / {
        proxy_pass http://localhost:5175;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
EOL"

# Enable sites
ssh $SERVER_HOST "ln -s /etc/nginx/sites-available/dev.averroesmind.xyz /etc/nginx/sites-enabled/"
ssh $SERVER_HOST "ln -s /etc/nginx/sites-available/test.averroesmind.xyz /etc/nginx/sites-enabled/"
ssh $SERVER_HOST "nginx -t && systemctl reload nginx"

# Set up SSL with Let's Encrypt
print_status "Setting up SSL with Let's Encrypt..."
ssh $SERVER_HOST "apt install certbot python3-certbot-nginx -y"
ssh $SERVER_HOST "certbot --nginx -d dev.averroesmind.xyz"
ssh $SERVER_HOST "certbot --nginx -d test.averroesmind.xyz"

print_status "Setup complete! Access the applications at:"
echo "Dev: https://dev.averroesmind.xyz"
echo "Test: https://test.averroesmind.xyz"
