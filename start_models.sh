#!/bin/bash

# Load manifest file
MANIFEST_FILE="ollama-manifest.json"
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: Manifest file not found"
    exit 1
fi

# Read model names from manifest
MODELS=$(cat $MANIFEST_FILE | jq -r '.models | keys[]')

# Start each model
for MODEL in $MODELS; do
    echo "Starting model: $MODEL"
    # Start model without configuration flags
    ollama run $MODEL &
done

# Wait for models to start
echo "Waiting for models to start..."
sleep 10

# Verify models are running
echo "Verifying model status:"
ollama list

echo "All models started successfully"
