# Averroes Deployment Guide

This guide provides detailed instructions for deploying Averroes in production.

## Prerequisites

### Hardware Requirements
- **CPU**: Multi-core processor (Recommended: 8+ cores)
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 250GB SSD minimum
- **GPU**: Optional for enhanced performance
- **Network**: Stable internet connection

### Software Requirements
- Node.js (v16 or higher)
- Nginx
- PM2
- Certbot (for SSL)
- Git
- Ollama

## Installation Steps

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

### 2. Clone Repository

```bash
git clone https://github.com/zeeshankhan1981/ai-models-zk.git
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```bash
# .env file
PORT=3000
API_PORT=3001
OLLAMA_URL=http://localhost:11434
NODE_ENV=production
```

### 4. Install Dependencies

```bash
cd ai-models-zk
npm install

# Install backend dependencies
cd server
npm install
```

### 5. Configure Nginx

Create a new Nginx configuration file:

```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/averroes
sudo ln -s /etc/nginx/sites-available/averroes /etc/nginx/sites-enabled/
```

### 6. Set Up SSL

```bash
sudo certbot --nginx -d averroes.xyz
```

### 7. Pull Required Models

```bash
ollama pull mistral
ollama pull deepseek
ollama pull starcoder2
ollama pull zephyr
ollama pull phi2
ollama pull metamath
ollama pull llama2
ollama pull llama3
ollama pull gemma:2b
```

### 8. Start Services

```bash
# Start Ollama
ollama serve &

# Start backend with PM2
pm2 start server.js --name averroes-backend

# Start frontend
pm2 start npm --name averroes-frontend -- start

# Save PM2 configuration
pm2 save
```

### 9. Configure Systemd Service (Optional)

Create a systemd service file:

```bash
sudo cp averroes.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable averroes
sudo systemctl start averroes
```

## Monitoring and Maintenance

### Log Management

```bash
# View backend logs
pm2 logs averroes-backend

# View frontend logs
pm2 logs averroes-frontend

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Backup System

The application automatically backs up:
- Chat history
- Model configurations
- User preferences

Backups are stored in the `backups/` directory.

### Performance Monitoring

```bash
# Check CPU usage
top

# Check memory usage
free -h

# Check disk usage
df -h

# Check PM2 process status
pm2 status
```

## Troubleshooting

### Common Issues

1. **Model Not Loading**
   - Verify Ollama service is running
   - Check model availability in Ollama
   - Review backend logs

2. **Performance Issues**
   - Monitor CPU and memory usage
   - Consider adding more RAM
   - Check for competing processes

3. **Connection Problems**
   - Verify firewall rules
   - Check port availability
   - Review Nginx configuration

### Error Logs

```bash
# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View backend error logs
pm2 logs averroes-backend --lines 100

# View frontend error logs
pm2 logs averroes-frontend --lines 100
```

## Security Best Practices

1. **Regular Updates**
   - Keep system packages up to date
   - Update Node.js and dependencies
   - Update Ollama

2. **Firewall Configuration**
   - Block unnecessary ports
   - Allow only required services
   - Use fail2ban for protection

3. **Backup Strategy**
   - Regular automated backups
   - Offsite backup storage
   - Test backup restoration

4. **Monitoring**
   - Set up system monitoring
   - Configure alert notifications
   - Regular log analysis

## Scaling Considerations

### Horizontal Scaling

For high-traffic environments, consider:

1. **Load Balancing**
   - Use Nginx as a reverse proxy
   - Configure session persistence
   - Monitor load distribution

2. **Database Optimization**
   - Implement caching
   - Optimize query performance
   - Consider database sharding

3. **Resource Management**
   - Configure resource limits
   - Implement rate limiting
   - Monitor resource usage

### Performance Optimization

1. **Caching**
   - Implement response caching
   - Use browser caching
   - Configure CDN

2. **Resource Optimization**
   - Optimize images and assets
   - Minimize JavaScript and CSS
   - Implement lazy loading

3. **Network Optimization**
   - Use HTTP/2
   - Implement SSL/TLS
   - Optimize DNS configuration
