# AverroesMind v3.0.0 Pre-Deployment Checklist

## 1. Local Environment Verification
- [x] All changes committed to Git repository
- [x] v3.0.0 tag created and pushed
- [x] Application runs correctly in local environment
- [x] Cancellation functionality tested and working

## 2. Dependencies Check
- [ ] All npm dependencies are up-to-date
- [ ] No conflicting dependencies in package.json
- [ ] Node.js version compatibility confirmed (current: v23.10.0)
- [ ] All required models available on production server

## 3. Server Preparation
- [ ] Verify SSH access to server: `ssh factoura`
- [ ] Check server disk space: `df -h`
- [ ] Check server memory: `free -h`
- [ ] Verify Ollama is running: `systemctl status ollama`
- [ ] Backup current production deployment

## 4. Deployment Process
1. SSH into server: `ssh factoura`
2. Navigate to deployment directory: `cd /var/www/averroesmind.xyz` (if exists)
3. Backup current deployment: `sudo cp -r /var/www/averroesmind.xyz /var/www/averroesmind.xyz.bak-$(date +%Y%m%d)`
4. Clone/pull latest code: 
   ```bash
   git clone https://github.com/zeeshankhan1981/ai-models-zk.git
   # OR if directory exists
   cd ai-models-zk && git pull
   ```
5. Checkout v3.0.0 tag: `git checkout v3.0.0`
6. Run deployment script: `sudo ./deploy.sh averroesmind.xyz`
7. Verify SSL certificate: `sudo certbot --nginx -d averroesmind.xyz -d www.averroesmind.xyz`

## 5. Post-Deployment Verification
- [ ] Website loads at https://averroesmind.xyz
- [ ] Model chain interface works correctly
- [ ] Cancellation functionality works in production
- [ ] No errors in server logs: `journalctl -u ollama -f` and `pm2 logs`
- [ ] Performance monitoring: `htop` shows acceptable resource usage

## 6. Rollback Plan (if needed)
1. Stop current deployment: `pm2 stop averroesmind`
2. Restore backup: `sudo rm -rf /var/www/averroesmind.xyz && sudo cp -r /var/www/averroesmind.xyz.bak-YYYYMMDD /var/www/averroesmind.xyz`
3. Restart service: `cd /var/www/averroesmind.xyz && pm2 start ecosystem.config.js`

## 7. CPU-Optimized Model Verification
- [ ] mistral model loaded and responsive
- [ ] phi:2 model loaded and responsive
- [ ] llama2 model loaded and responsive
- [ ] codellama:7b-code model loaded and responsive

## Notes
- Deployment is optimized for CPU-only environment (AMD Ryzen 7)
- PM2 is configured with 48GB memory limit
- Node.js memory limit set to 8GB
- Ollama configured to use 14 threads for optimal performance
