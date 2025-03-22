#!/bin/bash

# Setup Ollama models script
# This script creates Ollama models from existing model files

MODELS_DIR="/Users/zeeshankhan/ai-models"
MODELS=("mistral" "deepseek" "starcoder2" "zephyr" "phi2" "wizardmath" "metamath")

echo "Setting up Ollama models from $MODELS_DIR..."

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

# Create models in Ollama
for model in "${MODELS[@]}"; do
    echo "Setting up $model..."
    
    # Check if model already exists in Ollama
    if ollama list | grep -q "$model"; then
        echo "$model already exists in Ollama."
    else
        # Create model in Ollama
        case "$model" in
            "mistral")
                ollama pull mistral
                ;;
            "deepseek")
                ollama pull deepseek-coder
                ;;
            "starcoder2")
                ollama pull starcoder2
                ;;
            "zephyr")
                ollama pull zephyr
                ;;
            "phi2")
                ollama pull phi2
                ;;
            "wizardmath")
                ollama pull wizardmath
                ;;
            "metamath")
                ollama pull metamath
                ;;
            *)
                echo "Unknown model: $model"
                ;;
        esac
    fi
done

echo "Setup complete! All models have been configured in Ollama."
echo "Run ./start_models.sh to start the models on their respective ports."
