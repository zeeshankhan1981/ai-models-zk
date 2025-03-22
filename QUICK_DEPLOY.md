# AverroesMind Quick Deployment Guide

This guide provides the simplest way to deploy AverroesMind to your baremetal server.

## One-Command Deployment

1. SSH into your server:
   ```bash
   ssh factoura
   ```

2. Run the following commands:
   ```bash
   # Clone the repository
   git clone https://github.com/zeeshankhan1981/ai-models-zk.git
   cd ai-models-zk
   
   # Make the deployment script executable
   chmod +x deploy_baremetal.sh
   
   # Run the deployment script as root
   sudo ./deploy_baremetal.sh
   ```

3. When prompted for an email address for SSL certificates, enter your email.

4. Wait for the deployment to complete. This may take 15-30 minutes depending on your internet connection speed.

That's it! Your application will be available at https://averroesmind.xyz once the deployment is complete.

## What the Deployment Script Does

The `deploy_baremetal.sh` script:

1. Installs all required dependencies (Nginx, Node.js, Certbot, etc.)
2. Installs and configures Ollama for CPU-only usage
3. Builds the application
4. Sets up PM2 for process management
5. Configures Nginx with your domain
6. Sets up SSL certificates with Let's Encrypt
7. Pulls and optimizes the required models
8. Starts all services

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Check the Ollama logs:
   ```bash
   journalctl -u ollama -f
   ```

3. Check the application logs:
   ```bash
   pm2 logs averroesmind
   ```

4. If the deployment script fails, you can run it again. It's designed to be idempotent (can be run multiple times without issues).

## Troubleshooting Common Issues

### Module Compatibility Issues

If you encounter errors related to ES modules vs CommonJS, use the following fix:

```bash
# Copy the server file with .cjs extension to force CommonJS mode
cp server_commonjs.js server.cjs

# Restart the server with the .cjs file
pm2 stop all
pm2 delete all
pm2 start server.cjs --name averroesmind
pm2 save
```

### Port Conflicts

If you encounter port conflicts, check what's using the ports:

```bash
# Check what's using ports 3000 and 3001
netstat -tulpn | grep -E '3000|3001'

# Kill any processes using those ports
kill -9 <PID>
```

### Checking Available Models

To check which models are available in Ollama:

```bash
curl -s http://localhost:11434/api/tags
```

To check which models are available in the application:

```bash
curl -s http://localhost:3000/api/models
```

## Updating the Application

To update the application with the latest changes:

```bash
# Pull the latest changes
cd /var/www/averroesmind.xyz
git pull

# Rebuild the application
npm install
npm run build

# Restart the server
pm2 restart averroesmind
```

## Monitoring

To monitor the application:

```bash
# View logs
pm2 logs averroesmind

# View status
pm2 status

# Monitor CPU and memory usage
pm2 monit
```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

1. Install dependencies:
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm curl git htop
   ```

2. Install Ollama:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

3. Clone the repository:
   ```bash
   mkdir -p /var/www/averroesmind.xyz
   git clone https://github.com/zeeshankhan1981/ai-models-zk.git /var/www/averroesmind.xyz
   cd /var/www/averroesmind.xyz
   ```

4. Build the application:
   ```bash
   npm install --production
   npm run build
   ```

5. Set up PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name averroesmind
   pm2 save
   pm2 startup
   ```

6. Configure Nginx:
   ```bash
   # Create Nginx config
   sudo nano /etc/nginx/sites-available/averroesmind.xyz
   # Add the configuration from the deployment script
   
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/averroesmind.xyz /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. Set up SSL:
   ```bash
   sudo certbot --nginx -d averroesmind.xyz -d www.averroesmind.xyz
   ```
