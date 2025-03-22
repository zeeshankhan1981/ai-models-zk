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
