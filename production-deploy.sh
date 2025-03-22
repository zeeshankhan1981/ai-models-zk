#!/bin/bash

# AverroesMind v3.0.0 Production Deployment Script
# This script handles the deployment to averroesmind.xyz

# Exit on any error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting AverroesMind v3.0.0 deployment to production...${NC}"

# Step 1: Verify local environment
echo -e "${YELLOW}Step 1: Verifying local environment...${NC}"
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Make sure you're in the project root directory.${NC}"
  exit 1
fi

if [ ! -f "deploy.sh" ]; then
  echo -e "${RED}Error: deploy.sh not found. Make sure you're in the project root directory.${NC}"
  exit 1
fi

# Step 2: Verify git status
echo -e "${YELLOW}Step 2: Verifying git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}Warning: You have uncommitted changes. It's recommended to commit all changes before deploying.${NC}"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 3: Verify v3.0.0 tag exists
echo -e "${YELLOW}Step 3: Verifying v3.0.0 tag...${NC}"
if ! git tag | grep -q "v3.0.0"; then
  echo -e "${RED}Error: v3.0.0 tag not found. Please create and push the tag first.${NC}"
  exit 1
fi

# Step 4: SSH into production server and deploy
echo -e "${YELLOW}Step 4: Preparing to deploy to production server...${NC}"
echo -e "${GREEN}The following steps will be executed on the production server:${NC}"
echo "1. SSH into server"
echo "2. Backup current deployment"
echo "3. Clone/pull latest code"
echo "4. Checkout v3.0.0 tag"
echo "5. Run deployment script"
echo "6. Verify deployment"

read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Step 5: Execute deployment
echo -e "${YELLOW}Step 5: Executing deployment...${NC}"
echo -e "${GREEN}Connecting to production server...${NC}"

# Create deployment commands
DEPLOY_COMMANDS=$(cat << 'EOF'
# Print server info
echo "Server: $(hostname)"
echo "Current directory: $(pwd)"

# Create backup
echo "Creating backup of current deployment..."
BACKUP_DIR="/var/www/averroesmind.xyz.bak-$(date +%Y%m%d)"
if [ -d "/var/www/averroesmind.xyz" ]; then
  sudo cp -r /var/www/averroesmind.xyz $BACKUP_DIR
  echo "Backup created at $BACKUP_DIR"
fi

# Clone or update repository
if [ -d "/var/www/ai-models-zk" ]; then
  echo "Repository exists, updating..."
  cd /var/www/ai-models-zk
  git fetch --all
  git checkout v3.0.0
else
  echo "Cloning repository..."
  cd /var/www
  git clone https://github.com/zeeshankhan1981/ai-models-zk.git
  cd ai-models-zk
  git checkout v3.0.0
fi

# Run deployment script
echo "Running deployment script..."
chmod +x deploy.sh
sudo ./deploy.sh averroesmind.xyz

# Verify SSL certificate
echo "Verifying SSL certificate..."
sudo certbot --nginx -d averroesmind.xyz -d www.averroesmind.xyz

# Verify deployment
echo "Verifying deployment..."
curl -s https://averroesmind.xyz | grep -q "AverroesMind" && echo "Deployment successful!" || echo "Deployment verification failed!"

# Check Ollama status
echo "Checking Ollama status..."
systemctl status ollama | grep "active (running)" && echo "Ollama is running" || echo "Ollama is not running properly"

# Check PM2 status
echo "Checking PM2 status..."
pm2 status

echo "Deployment complete!"
EOF
)

# Execute deployment via SSH
ssh factoura "bash -s" << EOF
$DEPLOY_COMMANDS
EOF

# Step 6: Final verification
echo -e "${YELLOW}Step 6: Final verification...${NC}"
echo -e "${GREEN}Checking if website is accessible...${NC}"
if curl -s https://averroesmind.xyz | grep -q "AverroesMind"; then
  echo -e "${GREEN}✅ Deployment successful! AverroesMind v3.0.0 is now live at https://averroesmind.xyz${NC}"
else
  echo -e "${RED}⚠️ Website verification failed. Please check server logs and deployment status.${NC}"
fi

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify the application functionality manually"
echo "2. Check server logs with: ssh factoura 'pm2 logs'"
echo "3. Monitor server performance with: ssh factoura 'htop'"
