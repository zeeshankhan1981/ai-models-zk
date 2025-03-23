#!/bin/bash

# Start LocalMind - Your Personal AI Hub

echo "Starting LocalMind..."

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

# Start the server with PM2
echo "Starting backend server..."
pm2 start server.mjs --name "averroesmind" --watch --max-memory-restart 48G --node-args="--experimental-modules"
BACKEND_PID=$!

# Start the Ollama models
./start_models.sh

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start the frontend
echo "Starting frontend..."
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
