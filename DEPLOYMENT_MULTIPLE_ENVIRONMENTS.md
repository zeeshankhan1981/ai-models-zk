# Averroes Multi-Environment Deployment Guide

This guide provides detailed instructions for deploying Averroes with multiple environments (development and test) on a baremetal server.

## Prerequisites

### Hardware Requirements
- **CPU**: AMD Ryzen 7 or equivalent
- **RAM**: 64GB
- **Storage**: 4x 512GB SSDs
- **Network**: Stable internet connection

### Software Requirements
- Node.js (v18.20.6)
- Nginx
- PM2
- Certbot (for SSL)
- Git
- Ollama

## Deployment Steps

### 1. System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
sudo apt install -y nodejs npm

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Install Ollama
sudo apt install -y ollama
```

### 2. Clone Repository and Set Up Environments

```bash
# Clone repository
git clone https://github.com/zeeshankhan1981/ai-models-zk.git

# Set up development environment
mkdir -p /opt/averroes-dev
ln -s /path/to/repo /opt/averroes-dev

# Set up test environment
mkdir -p /opt/averroes-test
ln -s /path/to/repo /opt/averroes-test
```

### 3. Configure Nginx for Development Environment

Create `/etc/nginx/sites-available/dev.averroes.xyz`:

```nginx
server {
    listen 80;
    server_name dev.averroes.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dev.averroes.xyz;

    ssl_certificate /etc/letsencrypt/live/dev.averroes.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.averroes.xyz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
    }
}
```

### 4. Configure Nginx for Test Environment

Create `/etc/nginx/sites-available/test.averroes.xyz`:

```nginx
server {
    listen 80;
    server_name test.averroes.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name test.averroes.xyz;

    ssl_certificate /etc/letsencrypt/live/dev.averroes.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.averroes.xyz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5174;
    }
}
```

### 5. Enable Nginx Configurations

```bash
sudo ln -s /etc/nginx/sites-available/dev.averroes.xyz /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/test.averroes.xyz /etc/nginx/sites-enabled/
```

### 6. Set Up SSL Certificates

```bash
# Obtain SSL certificates for both domains
sudo certbot --nginx -d dev.averroes.xyz -d test.averroes.xyz --non-interactive --agree-tos --email admin@averroes.xyz
```

### 7. Start Development Environment

```bash
# Navigate to development environment
cd /opt/averroes-dev

# Install dependencies
npm install

# Start development server
npm run dev &
```

### 8. Start Test Environment

```bash
# Navigate to test environment
cd /opt/averroes-test

# Install dependencies
npm install

# Start test server
npm run dev &
```

### 9. Configure PM2 for Both Environments

```bash
# Navigate to development environment
cd /opt/averroes-dev

# Start development environment with PM2
pm2 start npm --name averroes-dev -- start

# Navigate to test environment
cd /opt/averroes-test

# Start test environment with PM2
pm2 start npm --name averroes-test -- start

# Save PM2 configuration
pm2 save
```

### 10. Verify Configuration

```bash
# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Verify services are running
pm2 status

# Check SSL certificates
sudo certbot certificates
```

## Accessing the Environments

- Development Environment: https://dev.averroes.xyz
- Test Environment: https://test.averroes.xyz

## Troubleshooting

### Common Issues

1. **Nginx Configuration Errors**
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify proxy_pass configuration
   - Ensure SSL certificates are valid

2. **Service Not Starting**
   - Check PM2 logs: `pm2 logs averroes-dev` and `pm2 logs averroes-test`
   - Verify ports are not blocked
   - Check firewall rules

3. **Timeout Issues**
   - Verify Nginx is listening on correct ports: `sudo netstat -tlnp | grep nginx`
   - Check if services are running locally: `curl -I http://localhost:5173` and `curl -I http://localhost:5174`
   - Verify proxy_pass configuration is using 127.0.0.1 instead of localhost

### Verification Commands

```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if ports are open
sudo netstat -tlnp | grep 80
sudo netstat -tlnp | grep 443
sudo netstat -tlnp | grep 5173
sudo netstat -tlnp | grep 5174

# Check SSL certificates
sudo certbot certificates

# Check PM2 processes
pm2 status
pm2 logs averroes-dev
pm2 logs averroes-test
