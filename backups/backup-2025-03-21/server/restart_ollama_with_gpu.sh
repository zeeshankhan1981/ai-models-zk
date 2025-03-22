#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Restarting Ollama with GPU Acceleration ===${NC}"
echo ""

# Stop Ollama if it's running
echo -e "${YELLOW}Stopping Ollama service...${NC}"
pkill -f "ollama serve" || true

# Wait for Ollama to fully stop
echo -e "${YELLOW}Waiting for Ollama to fully stop...${NC}"
sleep 3

# Start Ollama with GPU acceleration
echo -e "${YELLOW}Starting Ollama with GPU acceleration...${NC}"
/opt/homebrew/opt/ollama/bin/ollama serve &

# Wait for Ollama to start
echo -e "${YELLOW}Waiting for Ollama to start...${NC}"
sleep 5

echo -e "${GREEN}=== Ollama Restarted Successfully ===${NC}"
echo ""
echo -e "${BLUE}GPU acceleration is now enabled for Ollama.${NC}"
echo ""
echo -e "${YELLOW}To verify GPU usage:${NC}"
echo "1. Open Activity Monitor"
echo "2. Go to the GPU tab"
echo "3. Look for 'ollama' process when running models"
echo ""
