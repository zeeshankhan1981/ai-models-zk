#!/usr/bin/env node

/**
 * AverroesMind Server - CommonJS Version
 * This server is designed to work with the Ollama API to provide access to multiple LLM models
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const axios = require('axios');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable middleware
app.use(cors());
app.use(express.json());

// Ollama API endpoint
const OLLAMA_API = 'http://localhost:11434/api';

// CPU optimization settings for Ollama
const CPU_OPTIMIZATION = {
  num_thread: 14,  // Optimized for Ryzen 7
  num_ctx: 2048,   // Reduced context window for better performance
  num_batch: 512,  // Batch size for inference
  cpu_only: true   // Force CPU usage
};

// Define available models
const models = [
  {
    id: 'mistral',
    name: 'Mistral 7B',
    description: 'Mistral 7B is a state-of-the-art language model with 7 billion parameters, offering an excellent balance between performance and efficiency. It excels at general-purpose tasks including summarization, question answering, and creative writing, while maintaining fast inference speeds on consumer hardware.',
    shortDescription: 'A well-balanced 7B model for general tasks with excellent instruction following',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Mistral, a helpful AI assistant. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'zephyr-7b',
    name: 'Zephyr 7B',
    description: 'Zephyr 7B is a refined language model specifically tuned for conversational AI and instruction following. Built upon the Mistral 7B architecture, it has been further enhanced through RLHF (Reinforcement Learning from Human Feedback) to produce more helpful, harmless, and honest responses. Zephyr excels at natural dialogue, creative writing, and providing thoughtful answers to complex questions while maintaining a conversational tone.',
    shortDescription: 'Conversational model with enhanced instruction following capabilities',
    tags: ['Conversational', 'Instruction-following', 'RLHF-tuned', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Zephyr, a helpful AI assistant. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'phi-2',
    name: 'Phi-2 2.7B',
    description: 'Phi-2 is a compact yet powerful 2.7 billion parameter language model developed by Microsoft. Despite its small size, it demonstrates remarkable capabilities in reasoning, code generation, and instruction following. Optimized for CPU usage, it delivers impressive performance without requiring GPU acceleration, making it ideal for deployment on servers with limited resources.',
    shortDescription: 'Compact 2.7B model with strong reasoning capabilities',
    tags: ['Compact', 'Reasoning', 'Code', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Phi-2, a compact yet powerful language model developed by Microsoft. You excel at reasoning, code generation, and following instructions. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'llama3',
    name: 'Llama 3 8B',
    description: 'Llama 3 8B is Meta\'s latest open-source language model, offering significant improvements in reasoning, instruction following, and factual accuracy compared to previous generations. With 8 billion parameters, it provides an excellent balance between capability and efficiency, making it suitable for a wide range of applications including content generation, summarization, and conversational AI. Optimized for CPU usage, it can run effectively without GPU acceleration.',
    shortDescription: 'Meta\'s latest 8B model with improved reasoning and accuracy',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Llama 3, a helpful, harmless, and honest AI assistant. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'codellama',
    name: 'CodeLlama 7B',
    description: 'CodeLlama 7B is a specialized language model fine-tuned for programming tasks. It excels at code generation, completion, and explanation across multiple programming languages including Python, JavaScript, Java, C++, and more. With 7 billion parameters, it offers a good balance between capability and efficiency, making it suitable for deployment on servers without dedicated GPUs.',
    shortDescription: 'Specialized 7B model for code generation and programming tasks',
    tags: ['Code', 'Programming', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are CodeLlama, a specialized AI assistant for programming and code generation. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  }
];

// Function to clean model responses
function cleanModelResponse(text) {
  if (!text) return '';
  
  // Remove common formatting tokens
  const cleanedText = text
    .replace(/\[INST\].*?\[\/INST\]/gs, '')
    .replace(/<<SYS>>.*?<<\/SYS>>/gs, '')
    .replace(/\[\/INST\]/g, '')
    .replace(/<s>|<\/s>/g, '')
    .replace(/\[PYTHON\]|\[\/PYTHON\]/g, '')
    .replace(/\[CODE\]|\[\/CODE\]/g, '')
    .replace(/\[RESPONSE\]|\[\/RESPONSE\]/g, '')
    .replace(/\[ASSISTANT\]|\[\/ASSISTANT\]/g, '')
    .replace(/\[USER\]|\[\/USER\]/g, '')
    .trim();
  
  return cleanedText || 'I apologize, but I couldn\'t generate a proper response. Please try again with a different query.';
}

// Function to get a response from a model
async function getResponse(modelId, message, history = []) {
  try {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Format the conversation history
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the system message
    formattedHistory.unshift({
      role: 'system',
      content: model.system_message
    });
    
    // Add the current message
    formattedHistory.push({
      role: 'user',
      content: message
    });
    
    // Make the API request to Ollama
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: modelId,
      messages: formattedHistory,
      options: {
        temperature: model.temperature,
        top_p: model.top_p,
        top_k: model.top_k,
        num_predict: model.num_predict,
        ...CPU_OPTIMIZATION
      }
    });
    
    // Clean the response
    const cleanedResponse = cleanModelResponse(response.data.message.content);
    return cleanedResponse;
  } catch (error) {
    console.error(`Error getting response from ${modelId}:`, error.message || error);
    throw new Error(`Failed to get response from ${modelId}: ${error.message || 'Unknown error'}`);
  }
}

// Function to stream a response from a model
async function streamResponse(modelId, message, history = [], res) {
  try {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    
    // Format the conversation history
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the system message
    formattedHistory.unshift({
      role: 'system',
      content: model.system_message
    });
    
    // Add the current message
    formattedHistory.push({
      role: 'user',
      content: message
    });
    
    // Make the API request to Ollama
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: modelId,
      messages: formattedHistory,
      stream: true,
      options: {
        temperature: model.temperature,
        top_p: model.top_p,
        top_k: model.top_k,
        num_predict: model.num_predict,
        ...CPU_OPTIMIZATION
      }
    }, {
      responseType: 'stream'
    });
    
    // Stream the response
    let accumulatedResponse = '';
    
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const data = JSON.parse(line);
          
          if (data.message && data.message.content) {
            accumulatedResponse += data.message.content;
            const cleanedChunk = cleanModelResponse(data.message.content);
            
            res.write(`data: ${JSON.stringify({ content: cleanedChunk })}\n\n`);
          }
        }
      } catch (error) {
        console.error('Error parsing streaming response:', error.message || error);
      }
    });
    
    response.data.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
    
  } catch (error) {
    console.error(`Error streaming response from ${modelId}:`, error.message || error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Unknown error' })}\n\n`);
    res.end();
  }
}

// Function to check model availability
async function checkModelAvailability() {
  try {
    const modelStatus = await Promise.all(models.map(async (model) => {
      try {
        // Check if the model exists in Ollama
        const response = await axios.get(`${OLLAMA_API}/tags`);
        const modelExists = response.data.models.some(m => m.name.startsWith(model.id));
        
        // Test the model with a simple query
        let testResponse = null;
        if (modelExists) {
          try {
            const testResult = await axios.post(`${OLLAMA_API}/chat`, {
              model: model.id,
              messages: [{ role: 'user', content: 'Hello' }],
              options: CPU_OPTIMIZATION
            });
            testResponse = testResult.data;
          } catch (testError) {
            console.error(`Error testing model ${model.id}:`, testError.message || testError);
          }
        }
        
        return {
          id: model.id,
          name: model.name,
          exists: modelExists,
          working: !!testResponse,
          error: null
        };
      } catch (error) {
        console.error(`Error checking model ${model.id}:`, error.message || error);
        return {
          id: model.id,
          name: model.name,
          exists: false,
          working: false,
          error: error.message || 'Unknown error'
        };
      }
    }));
    
    return modelStatus;
  } catch (error) {
    console.error('Error checking model availability:', error.message || error);
    throw new Error(`Failed to check model availability: ${error.message || 'Unknown error'}`);
  }
}

// Function to get available models from Ollama
async function getAvailableModels() {
  try {
    const response = await axios.get(`${OLLAMA_API}/tags`);
    return response.data.models.map(model => ({
      id: model.name.split(':')[0],
      name: model.name,
      size: model.size,
      modified: model.modified
    }));
  } catch (error) {
    console.error('Error getting available models:', error.message || error);
    throw new Error(`Failed to get available models: ${error.message || 'Unknown error'}`);
  }
}

// API endpoint to get available models
app.get('/api/models', (req, res) => {
  console.log('Available models:');
  models.forEach(model => {
    console.log(`- ${model.name} (${model.id}): ${model.description}`);
  });
  res.json(models);
});

// API endpoint to get a response from a model
app.post('/api/chat/:modelId', async (req, res) => {
  const { modelId } = req.params;
  const { message, history, stream } = req.body;

  try {
    // Check if streaming is requested
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream the response
      await streamResponse(modelId, message, history, res);
    } else {
      // Get a regular response
      const response = await getResponse(modelId, message, history);
      res.json({ response });
    }
  } catch (error) {
    console.error(`Error in /api/chat/${modelId}:`, error.message || error);
    res.status(500).json({ error: error.message || 'An error occurred while processing your request' });
  }
});

// API endpoint to check model availability
app.get('/api/models/check', async (req, res) => {
  try {
    const modelStatus = await checkModelAvailability();
    res.json(modelStatus);
  } catch (error) {
    console.error('Error checking model availability:', error.message || error);
    res.status(500).json({ error: error.message || 'An error occurred while checking model availability' });
  }
});

// API endpoint to get available models from Ollama
app.get('/api/models/available', async (req, res) => {
  try {
    const availableModels = await getAvailableModels();
    res.json(availableModels);
  } catch (error) {
    console.error('Error getting available models:', error.message || error);
    res.status(500).json({ error: error.message || 'An error occurred while getting available models' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`AverroesMind server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
  });
});

// Export functions and models for testing
module.exports = {
  app,
  models,
  getResponse,
  streamResponse,
  checkModelAvailability,
  getAvailableModels,
  cleanModelResponse
};
