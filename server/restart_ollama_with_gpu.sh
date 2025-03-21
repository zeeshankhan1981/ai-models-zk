#!/bin/bash

echo "Stopping Ollama service..."
pkill -f "ollama serve"

echo "Waiting for Ollama to fully stop..."
sleep 2

echo "Starting Ollama with GPU acceleration..."
/opt/homebrew/opt/ollama/bin/ollama serve &

echo "Waiting for Ollama to start..."
sleep 5

echo "Ollama is now running with GPU acceleration enabled."
echo "You can verify GPU usage by running models and checking Activity Monitor."
echo ""
echo "To pull MythoMax-L2, run: ollama pull mythomaxl2"
