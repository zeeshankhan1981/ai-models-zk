#!/bin/bash

# Define model name and Modelfile content
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
echo "Creating Modelfile for $MODEL_NAME..."
echo "$MODEL_FILE_CONTENT" > /tmp/Modelfile

# Create the model
echo "Creating $MODEL_NAME model with GPU acceleration..."
ollama create $MODEL_NAME -f /tmp/Modelfile

# Clean up
rm /tmp/Modelfile

echo "MythoMax-L2 has been set up as '$MODEL_NAME'."
echo "You can now use it in your application."
