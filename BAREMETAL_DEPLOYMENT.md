# AverroesMind Baremetal Deployment Guide

This guide provides specific instructions for deploying AverroesMind to your AMD Ryzen 7 baremetal server with 64GB RAM and 4x 512GB SSDs.

## Server Specifications

- **CPU**: AMD Ryzen 7
- **RAM**: 64GB
- **Storage**: 4x 512GB SSD
- **GPU**: None (CPU-only deployment)
- **IP Address**: 65.109.156.106
- **Domain**: averroesmind.xyz (already configured to point to server IP)

## Deployment Options

### Option 1: SSH Direct Deployment

1. SSH into your server:
   ```bash
   ssh factoura
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/zeeshankhan1981/ai-models-zk.git
   cd ai-models-zk
   ```

3. Run the deployment script (which has been optimized for your CPU-only setup):
   ```bash
   chmod +x deploy.sh
   sudo ./deploy.sh averroesmind.xyz
   ```

4. Set up SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d averroesmind.xyz -d www.averroesmind.xyz
   ```

### Option 2: Docker Deployment

1. SSH into your server:
   ```bash
   ssh factoura
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/zeeshankhan1981/ai-models-zk.git
   cd ai-models-zk
   ```

3. Run the Docker initialization script:
   ```bash
   chmod +x init-docker.sh
   ./init-docker.sh averroesmind.xyz
   ```

## CPU Optimization

The deployment has been specifically optimized for your CPU-only environment:

### Ollama CPU Optimization

- **Thread Count**: Set to 14 threads (optimized for Ryzen 7)
- **Context Window**: Reduced to 2048 for better performance
- **Batch Size**: Set to 512 for efficient inference
- **CPU-Only Mode**: Enabled to prevent GPU-related errors

### Memory Allocation

- **Node.js Memory**: Limited to 8GB with `--max-old-space-size=8192`
- **Ollama Memory**: Limited to 48GB maximum to leave room for the OS and other processes
- **PM2 Restart**: Configured to restart if memory exceeds 48GB

### Model Selection

The following models have been optimized for CPU usage:

1. **mistral-cpu**: General purpose model
2. **phi-cpu**: Compact but powerful model for reasoning
3. **codellama-cpu**: Specialized for coding tasks

## Performance Monitoring

To monitor system performance:

```bash
# Monitor CPU, memory, and disk usage
htop

# Monitor Ollama logs
journalctl -u ollama -f

# For Docker deployment, monitor container stats
docker stats
```

## Troubleshooting

### Slow Model Responses

If model responses are too slow:

1. Reduce the context window further:
   ```bash
   # For standard deployment
   sudo nano /etc/systemd/system/ollama.service
   # Add or modify: Environment="OLLAMA_NUM_CTX=1024"
   
   # For Docker deployment
   nano modelfiles/Mistral
   # Change: PARAMETER num_ctx 1024
   ```

2. Use smaller models:
   ```bash
   # Pull smaller models
   ollama pull phi:2  # Only 2.7B parameters
   ```

### Memory Issues

If you encounter out-of-memory errors:

1. Reduce PM2 memory allocation:
   ```bash
   nano /var/www/averroesmind.xyz/ecosystem.config.js
   # Change max_memory_restart to "32G"
   ```

2. Limit Ollama memory usage:
   ```bash
   # For Docker deployment
   nano docker-compose.yml
   # Change memory limits to 32G
   ```

### Server Maintenance

Regular maintenance tasks:

1. Update the application:
   ```bash
   cd /path/to/ai-models-zk
   git pull
   npm install
   npm run build
   sudo ./deploy.sh averroesmind.xyz
   ```

2. Monitor disk space:
   ```bash
   df -h
   ```

3. Clean up Ollama cache if needed:
   ```bash
   rm -rf ~/.ollama/models/*
   ```

## Deployment Lessons Learned (v3.0.0+)

After our experience deploying v3.0.0, we've documented the following critical steps to ensure smooth deployments:

### Node.js Version Requirements

AverroesMind v3.0.0+ requires Node.js 20.x. To ensure the correct version:

```bash
# Install NVM if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
node --version  # Should show v20.x.x
```

### Proper HTTPS Configuration

The application requires proper HTTPS configuration. Here's the correct Nginx setup:

```nginx
# /etc/nginx/sites-available/averroesmind.xyz
server {
    listen 80;
    server_name averroesmind.xyz www.averroesmind.xyz;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name averroesmind.xyz www.averroesmind.xyz;
    
    ssl_certificate /etc/letsencrypt/live/averroesmind.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/averroesmind.xyz/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers EECDH+AESGCM:EDH+AESGCM;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 180m;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

After creating this file, enable it and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/averroesmind.xyz /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Deployment Script

For future deployments, use the following improved deployment script:

```bash
#!/bin/bash
# production-deploy.sh - Improved deployment script for AverroesMind v3.0.0+

set -e  # Exit on any error

echo "🚀 Starting AverroesMind deployment..."

# 1. SSH into server
ssh factoura << 'EOF'
  cd /var/www/averroesmind.xyz

  # 2. Pull latest changes
  git pull

  # 3. Ensure correct Node.js version
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm use 20 || (echo "Installing Node.js 20..." && nvm install 20 && nvm use 20)
  echo "Now using Node.js version: $(node --version)"

  # 4. Install dependencies
  echo "Installing dependencies..."
  npm install

  # 5. Build the application
  echo "Building application..."
  npm run build

  # 6. Restart the application
  echo "Restarting application..."
  pm2 restart averroesmind || pm2 start npm --name "averroesmind" -- start

  # 7. Check Nginx configuration
  echo "Verifying Nginx configuration..."
  sudo nginx -t && sudo systemctl reload nginx

  echo "✅ Deployment completed successfully!"
EOF

echo "🎉 Deployment process finished!"
```

### Deployment Checklist

Before deploying a new version, ensure:

1. All changes are committed and pushed to the repository
2. The application builds successfully locally
3. SSL certificates are valid and not expired
4. PM2 is configured with the correct memory limits
5. Ollama is running with CPU optimizations

Following these steps will help avoid common deployment issues and ensure a smooth deployment process.

## Backup Strategy

Regularly backup your data:

```bash
# Backup the application
sudo cp -r /var/www/averroesmind.xyz /var/backups/averroesmind-$(date +%Y%m%d)

# Backup Nginx configuration
sudo cp /etc/nginx/sites-available/averroesmind.xyz /var/backups/

# For Docker deployment, backup volumes
docker run --rm -v ollama-data:/data -v /backup:/backup alpine tar -czf /backup/ollama-data-$(date +%Y%m%d).tar.gz /data
```
