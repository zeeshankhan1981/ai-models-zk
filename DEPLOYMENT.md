# AverroesMind Deployment Guide

This guide explains how to deploy AverroesMind to a production server.

## Prerequisites

- A Linux server (Ubuntu/Debian recommended)
- Node.js 18+ installed
- Nginx installed
- Domain name (averroesmind.xyz) with DNS configured to point to your server
- Ollama installed and running on the server

## Deployment Options

### Option 1: Automated Deployment (Recommended)

1. Clone the repository on your server:
   ```bash
   git clone https://github.com/yourusername/ai-models-zk.git
   cd ai-models-zk
   ```

2. Run the deployment script:
   ```bash
   sudo ./deploy.sh averroesmind.xyz
   ```

3. Set up SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d averroesmind.xyz -d www.averroesmind.xyz
   ```

4. Pull the required Ollama models:
   ```bash
   ollama pull llama2
   ollama pull mistral
   ollama pull codellama
   ollama pull phi
   # Add other models as needed
   ```

### Option 2: Manual Deployment

#### 1. Build the Application

```bash
npm install
npm run build
```

#### 2. Set Up the Server Directory

```bash
sudo mkdir -p /var/www/averroesmind.xyz
sudo cp -r dist server server.js package.json package-lock.json /var/www/averroesmind.xyz/
cd /var/www/averroesmind.xyz
sudo npm install --production
```

#### 3. Configure Nginx

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/averroesmind.xyz
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name averroesmind.xyz www.averroesmind.xyz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/averroesmind.xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. Set Up SSL with Let's Encrypt

```bash
sudo certbot --nginx -d averroesmind.xyz -d www.averroesmind.xyz
```

#### 5. Set Up Process Management with PM2

```bash
sudo npm install -g pm2
cd /var/www/averroesmind.xyz
pm2 start server.js --name averroesmind
pm2 save
pm2 startup
```

#### 6. Pull Required Ollama Models

```bash
ollama pull llama2
ollama pull mistral
ollama pull codellama
ollama pull phi
# Add other models as needed
```

## Troubleshooting

### Application Not Starting

Check the logs:
```bash
pm2 logs averroesmind
```

### Nginx Not Working

Check Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

Verify the certificate:
```bash
sudo certbot certificates
```

### Ollama Not Working

Check if Ollama is running:
```bash
systemctl status ollama
```

## Updating the Application

To update the application:

1. Pull the latest changes:
   ```bash
   cd /path/to/your/repo
   git pull
   ```

2. Rebuild and redeploy:
   ```bash
   npm install
   npm run build
   sudo ./deploy.sh averroesmind.xyz
   ```

## Backup Strategy

Regularly backup your data:

```bash
# Backup the application
sudo cp -r /var/www/averroesmind.xyz /var/backups/averroesmind-$(date +%Y%m%d)

# Backup Nginx configuration
sudo cp /etc/nginx/sites-available/averroesmind.xyz /var/backups/
```
