#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== GPU Usage Monitor for Ollama ===${NC}"
echo ""
echo -e "${YELLOW}This script will continuously monitor GPU usage for the Ollama process.${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit.${NC}"
echo ""

# Check if we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo -e "${RED}This script is designed for macOS only.${NC}"
  exit 1
fi

# Function to get GPU usage for Ollama
get_gpu_usage() {
  # Get the PID of the Ollama process
  OLLAMA_PID=$(pgrep -f "ollama serve")
  
  if [ -z "$OLLAMA_PID" ]; then
    echo -e "${RED}Ollama process not found. Is it running?${NC}"
    return 1
  fi
  
  # Use powermetrics to get GPU usage (requires sudo)
  echo -e "${YELLOW}Running powermetrics to monitor GPU usage (requires sudo)...${NC}"
  echo -e "${YELLOW}This will show overall GPU usage, look for 'ollama' in Activity Monitor for process-specific usage.${NC}"
  echo ""
  
  sudo powermetrics --samplers gpu_power -i 1000 -n 5
}

# Main loop
while true; do
  echo -e "${BLUE}=== GPU Usage Report at $(date) ===${NC}"
  get_gpu_usage
  echo ""
  echo -e "${YELLOW}Waiting 10 seconds before next check...${NC}"
  sleep 10
done
