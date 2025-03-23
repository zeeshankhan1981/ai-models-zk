#!/bin/bash

# Initialize Docker deployment for Averroes
# This script sets up the necessary directories and configurations for Docker deployment

# Exit on any error
set -e

echo "🚀 Initializing Docker deployment for Averroes..."

# Create required directories
echo "📁 Creating required directories..."
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p logs

# Check if domain is provided
if [ -z "$1" ]; then
  DOMAIN="averroes.xyz"
else
  DOMAIN=$1
fi

echo "📝 Setting up for domain: $DOMAIN"

# Update email in docker-compose.yml
echo "✏️ Updating email in docker-compose.yml..."
read -p "Enter your email address for SSL certificate notifications: " EMAIL
sed -i '' "s/your-email@example.com/$EMAIL/g" docker-compose.yml

# Build the application
echo "🏗️ Building the application..."
npm install
npm run build

# Create a temporary Nginx config for initial setup
echo "⚙️ Creating temporary Nginx config for initial setup..."
cat > nginx/conf.d/init.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'Averroes is being set up!';
        add_header Content-Type text/plain;
    }
}
EOF

# Create a specific Ollama Modelfile for CPU optimization
echo "⚙️ Creating Ollama Modelfiles for CPU optimization..."
mkdir -p modelfiles

# Mistral Modelfile with CPU optimization
cat > modelfiles/Mistral << EOF
FROM mistral
PARAMETER num_ctx 2048
PARAMETER num_thread 14
PARAMETER num_batch 512
PARAMETER cpu_only true
EOF

# Phi-2 Modelfile with CPU optimization
cat > modelfiles/Phi << EOF
FROM phi:2
PARAMETER num_ctx 2048
PARAMETER num_thread 14
PARAMETER num_batch 512
PARAMETER cpu_only true
EOF

# Codellama Modelfile with CPU optimization
cat > modelfiles/Codellama << EOF
FROM codellama:7b-code
PARAMETER num_ctx 2048
PARAMETER num_thread 14
PARAMETER num_batch 512
PARAMETER cpu_only true
EOF

# Start Nginx container for initial certificate acquisition
echo "🚀 Starting Nginx container for initial certificate acquisition..."
docker-compose up -d nginx

# Wait for Nginx to start
echo "⏳ Waiting for Nginx to start..."
sleep 5

# Run Certbot to get certificates
echo "🔒 Running Certbot to get SSL certificates..."
docker-compose up certbot

# Replace the temporary Nginx config with the real one
echo "⚙️ Updating Nginx configuration..."
cp nginx/conf.d/averroes.conf nginx/conf.d/init.conf

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Pull and create CPU-optimized models
echo "📦 Pulling and creating CPU-optimized models..."
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull phi:2
docker-compose exec ollama ollama pull llama2
docker-compose exec ollama ollama pull codellama:7b-code

echo "📦 Creating CPU-optimized models from Modelfiles..."
docker-compose exec ollama ollama create mistral-cpu -f /root/.ollama/modelfiles/Mistral
docker-compose exec ollama ollama create phi-cpu -f /root/.ollama/modelfiles/Phi
docker-compose exec ollama ollama create codellama-cpu -f /root/.ollama/modelfiles/Codellama

echo "🎉 Docker deployment initialized successfully!"
echo "🌐 Your application will be available at: https://$DOMAIN"
echo ""
echo "📝 Next steps:"
echo "1. Make sure your DNS is configured to point to this server"
echo "2. Check if the SSL certificate was issued correctly"
echo "3. Monitor system performance with: docker stats"
echo "4. Check Ollama logs with: docker-compose logs -f ollama"
echo ""
echo "🔄 To restart the services: docker-compose restart"
echo "🛑 To stop the services: docker-compose down"
echo "📊 To view logs: docker-compose logs -f"
