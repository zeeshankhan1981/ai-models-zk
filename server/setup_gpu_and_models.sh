#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Optimizing Ollama for GPU Acceleration on Apple Silicon ===${NC}"
echo ""

# Create Ollama config directory if it doesn't exist
echo -e "${YELLOW}Creating Ollama configuration directory...${NC}"
mkdir -p ~/.ollama/config

# Create Ollama configuration file
echo -e "${YELLOW}Creating GPU-optimized configuration...${NC}"
cat > ~/.ollama/config/ollama.json << EOL
{
  "gpu": {
    "enable": true,
    "layers": -1
  },
  "runner": {
    "num_ctx": 4096,
    "num_batch": 512,
    "num_thread": 8
  }
}
EOL

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

# Define model name and Modelfile content for MythoMax-L2
MODEL_NAME="mythomaxl2"
MODEL_FILE_CONTENT="FROM mythologic/mythomax-l2-13b-8_0:latest

# Set parameters for the model
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096

# Set a system message that will be prepended to the conversation
SYSTEM You are MythoMax-L2, a creative and imaginative AI assistant with a flair for storytelling and creative writing. You excel at generating rich, detailed content with mythological and fantastical elements. You're also capable of general reasoning, problem-solving, and providing helpful information across a wide range of topics."

# Create Modelfile
echo -e "${YELLOW}Creating Modelfile for $MODEL_NAME...${NC}"
echo "$MODEL_FILE_CONTENT" > /tmp/Modelfile

# Pull and create the model
echo -e "${YELLOW}Pulling and creating $MODEL_NAME model with GPU acceleration...${NC}"
ollama pull mythologic/mythomax-l2-13b-8_0:latest
ollama create $MODEL_NAME -f /tmp/Modelfile

# Clean up
rm /tmp/Modelfile

# Restart the API server
echo -e "${YELLOW}Restarting API server...${NC}"
cd /Users/zeeshankhan/ai-models-zk/server
npm restart

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo -e "${BLUE}GPU acceleration is now enabled for Ollama.${NC}"
echo -e "${BLUE}MythoMax-L2 has been set up as '$MODEL_NAME'.${NC}"
echo ""
echo -e "${YELLOW}To verify GPU usage:${NC}"
echo "1. Open Activity Monitor"
echo "2. Go to the GPU tab"
echo "3. Look for 'ollama' process when running models"
echo ""
echo -e "${YELLOW}To test MythoMax-L2:${NC}"
echo "ollama run mythomaxl2 \"Tell me a short story about a brave explorer\""
echo ""
