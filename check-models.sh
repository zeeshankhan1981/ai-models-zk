#!/bin/bash

# Script to check and pull required models for AverroesMind model chain
echo "🔍 Checking for required models for AverroesMind model chain..."

# Define required models
REQUIRED_MODELS=("gemma:2b" "mistral:latest" "zephyr-7b:latest" "llama3:latest")

# Get list of available models
echo "📋 Getting list of available models from Ollama..."
AVAILABLE_MODELS=$(ollama list)

# Check each required model
for MODEL in "${REQUIRED_MODELS[@]}"; do
  echo "🔍 Checking for model: $MODEL"
  if echo "$AVAILABLE_MODELS" | grep -q "$MODEL"; then
    echo "✅ Model $MODEL is available"
  else
    echo "❌ Model $MODEL is not available. Pulling..."
    ollama pull $MODEL
    if [ $? -eq 0 ]; then
      echo "✅ Successfully pulled model $MODEL"
    else
      echo "❌ Failed to pull model $MODEL"
    fi
  fi
done

# Check Ollama service status
echo "🔍 Checking Ollama service status..."
if systemctl is-active --quiet ollama; then
  echo "✅ Ollama service is running"
else
  echo "❌ Ollama service is not running. Starting..."
  systemctl start ollama
  if [ $? -eq 0 ]; then
    echo "✅ Successfully started Ollama service"
  else
    echo "❌ Failed to start Ollama service"
  fi
fi

# Check if Ollama is listening on the correct port
echo "🔍 Checking if Ollama is listening on port 11434..."
if netstat -tuln | grep -q ":11434"; then
  echo "✅ Ollama is listening on port 11434"
else
  echo "❌ Ollama is not listening on port 11434"
  echo "🔧 Checking Ollama configuration..."
  if grep -q "OLLAMA_HOST" /etc/systemd/system/ollama.service; then
    echo "📋 Current Ollama configuration:"
    grep "OLLAMA_" /etc/systemd/system/ollama.service
  else
    echo "❌ Ollama service file doesn't contain OLLAMA_HOST configuration"
    echo "🔧 Adding OLLAMA_HOST configuration..."
    sudo sed -i '/\[Service\]/a Environment="OLLAMA_HOST=0.0.0.0"' /etc/systemd/system/ollama.service
    sudo systemctl daemon-reload
    sudo systemctl restart ollama
  fi
fi

echo "✅ Model check complete"
