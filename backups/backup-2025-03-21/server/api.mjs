const express = import express from 'express';
const cors = import cors from 'cors';
const axios = import axios from 'axios';
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Ollama API endpoint
const OLLAMA_API = 'http://localhost:11434/api';

// Available models with their capabilities
const models = [
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'A balanced model with good instruction following capabilities',
    capabilities: ['general', 'reasoning', 'instruction'],
    characterLimit: 1500,
    temperature: 0.4,
    top_p: 0.8,
    top_k: 30,
    num_predict: 256,
    requiresGPU: true,
    systemPrompt: "You are a helpful, direct assistant. Provide brief, accurate answers without unnecessary elaboration. For simple questions, give simple, one-sentence answers. For complex questions, be concise but thorough. Never list additional questions or tangential information. Stick strictly to answering what was asked. If unsure, say 'I don't know' rather than guessing."
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Specialized for code generation and understanding',
    capabilities: ['code', 'reasoning', 'math'],
    characterLimit: 1500,
    temperature: 0.3,
    top_p: 0.9,
    top_k: 30,
    num_predict: 256,
    requiresGPU: true,
    systemPrompt: "You are DeepSeek, a coding assistant. Provide direct, practical code solutions with minimal explanation. Include only essential comments. For technical questions, give concise, factual answers. Never elaborate beyond what's necessary. If unsure, admit uncertainty rather than guessing."
  },
  {
    id: 'starcoder2',
    name: 'StarCoder2',
    description: 'Advanced code generation and completion',
    capabilities: ['code', 'programming', 'documentation'],
    characterLimit: 1500,
    temperature: 0.3,
    top_p: 0.9,
    top_k: 30,
    num_predict: 256,
    requiresGPU: true,
    systemPrompt: "You are StarCoder2, a coding assistant. Provide clean, efficient code with minimal explanation. Include only essential comments. Focus exclusively on the coding task requested. Never add tangential information or suggestions unless specifically asked. If unsure about any aspect, clearly state your uncertainty."
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    description: 'A balanced model with good instruction following capabilities',
    capabilities: ['general', 'reasoning', 'creative'],
    characterLimit: 1500,
    temperature: 0.5,
    top_p: 0.8,
    top_k: 30,
    num_predict: 256,
    requiresGPU: false,
    systemPrompt: "You are Zephyr, a helpful assistant. Provide direct, concise answers. For simple questions, give one-sentence responses. For complex topics, be brief but informative. Never add unnecessary details or tangential information. Answer exactly what was asked and nothing more. If unsure, simply state that you don't know."
  },
  {
    id: 'phi2',
    name: 'Phi-2',
    description: 'A small but powerful model for general tasks',
    capabilities: ['general', 'instruction', 'efficiency'],
    characterLimit: 1500,
    temperature: 0.5,
    top_p: 0.8,
    top_k: 30,
    num_predict: 256,
    requiresGPU: false,
    systemPrompt: "You are Phi-2, a direct assistant. Give brief, accurate answers. For simple questions, provide one-sentence responses. Never elaborate unless specifically asked. Focus only on answering exactly what was asked. If you don't know something, say so directly without speculation."
  },
  {
    id: 'wizardmath',
    name: 'WizardMath',
    description: 'Specialized for mathematical problem solving',
    capabilities: ['math', 'reasoning', 'problem-solving'],
    characterLimit: 1500,
    temperature: 0.3,
    top_p: 0.9,
    top_k: 30,
    num_predict: 256,
    requiresGPU: true,
    systemPrompt: "You are WizardMath, a math assistant. Provide clear, concise solutions to math problems. Show key steps but avoid unnecessary explanations. Give direct answers with minimal elaboration. For simple questions, provide just the answer. For complex problems, include only essential steps. Never add tangential information."
  },
  {
    id: 'metamath',
    name: 'MetaMath',
    description: 'Specialized for advanced mathematical reasoning and formal proofs',
    characterLimit: 1500,
    temperature: 0.3,
    top_p: 0.9,
    top_k: 30,
    num_predict: 256,
    capabilities: ['math', 'reasoning', 'formal-logic'],
    requiresGPU: true,
    systemPrompt: "You are MetaMath, a mathematics assistant. Provide precise, concise mathematical explanations and proofs. Include only essential steps and notation. For simple questions, give direct answers without elaboration. For complex proofs, include only necessary steps. Never add tangential information or unnecessary context."
  }
];

// Helper function to clean model responses
function cleanModelResponse(text) {
  // Remove common formatting tokens from model responses
  const patterns = [
    /\[INST\].*?\[\/INST\]/gs,
    /<\/?s>/g,
    /<<SYS>>.*?<\/SYS>/gs,
    /<\|.*?\|>/g,
    /\[\/INST\]/g,
    /\[INST\]/g
  ];
  
  let cleaned = text;
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.trim();
}

// Get available models
app.get('/api/models', (req, res) => {
  res.json({ models });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { model, prompt, systemPrompt } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }
    
    // Find the selected model
    const selectedModel = models.find(m => m.id === model);
    const defaultSystemPrompt = "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer. Always verify facts before stating them and avoid making up information.";
    
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || selectedModel?.systemPrompt || defaultSystemPrompt },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: selectedModel?.temperature || 0.7,
        top_p: selectedModel?.top_p || 0.9,
        top_k: selectedModel?.top_k || 40,
        num_predict: selectedModel?.num_predict || 512
      }
    });
    
    const cleanedResponse = cleanModelResponse(response.data.message.content);
    res.json({ response: cleanedResponse });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to get response from model' });
  }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { model, prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const selectedModel = models.find(m => m.id === model);
    
    if (!selectedModel) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // Set up headers for streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const response = await axios.post(`${OLLAMA_API}/generate`, {
      model: selectedModel.id,
      prompt: prompt,
      system: selectedModel.systemPrompt,
      options: {
        temperature: selectedModel?.temperature || 0.7,
        top_p: selectedModel?.top_p || 0.9,
        top_k: selectedModel?.top_k || 40,
        num_predict: selectedModel?.num_predict || 512,
        stream: true
      }
    }, {
      responseType: 'stream'
    });
    
    // Stream the response to the client
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.response) {
              res.write(data.response);
            }
            
            // If done, end the response
            if (data.done) {
              return res.end();
            }
          } catch (parseError) {
            console.error('Error parsing JSON line:', parseError);
          }
        }
      } catch (streamError) {
        console.error('Error processing stream chunk:', streamError);
      }
    });
    
    // Handle errors and completion
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      response.data.destroy();
    });
    
  } catch (error) {
    console.error('Error in streaming chat:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error generating streaming response' });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Available models:');
  models.forEach(model => {
    console.log(`- ${model.name} (${model.id}): ${model.description}`);
  });
});
