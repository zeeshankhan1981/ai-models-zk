#!/bin/bash

# Start models script
# This script starts all models on the correct ports with GPU acceleration for larger models

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Please install it first."
    echo "Visit https://ollama.ai/ for installation instructions."
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "Ollama service is not running. Starting it now..."
    open -a Ollama
    sleep 5
fi

# Define models with their ports and GPU settings
declare -a models=(
    "mistral:8000:false"
    "deepseek-coder:8001:false"
    "starcoder2:8002:true"
    "zephyr:8003:false"
    "phi2:8004:false"
    "wizardmath:8005:true"
    "metamath:8006:true"
)

# Start each model
for model_info in "${models[@]}"; do
    IFS=':' read -r model port use_gpu <<< "$model_info"
    
    # Check if model exists
    if ! ollama list | grep -q "$model"; then
        echo "Model $model not found. Please run ./setup_ollama.sh first."
        continue
    fi
    
    # Start the model
    echo "Starting $model on port $port..."
    
    if [ "$use_gpu" = "true" ]; then
        echo "Using GPU acceleration for $model"
        nohup ollama serve --model $model --port $port --gpu &
    else
        nohup ollama serve --model $model --port $port &
    fi
    
    # Wait a bit to avoid overwhelming the system
    sleep 2
done

echo "All models started successfully!"
echo "API server can now connect to these models."
