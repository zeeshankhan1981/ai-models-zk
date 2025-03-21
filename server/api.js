const express = require('express');
const cors = require('cors');
const axios = require('axios');
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
    temperature: 0.7
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Specialized for code generation and understanding',
    capabilities: ['code', 'reasoning', 'math'],
    characterLimit: 1500,
    temperature: 0.7
  },
  {
    id: 'starcoder2',
    name: 'StarCoder2',
    description: 'Advanced code generation and completion',
    capabilities: ['code', 'programming', 'documentation'],
    characterLimit: 1500,
    temperature: 0.7
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    description: 'A balanced model with good instruction following capabilities',
    capabilities: ['general', 'reasoning', 'creative'],
    characterLimit: 1500,
    temperature: 0.7
  },
  {
    id: 'phi2',
    name: 'Phi-2',
    description: 'A small but powerful model for general tasks',
    capabilities: ['general', 'instruction', 'efficiency'],
    characterLimit: 1500,
    temperature: 0.7
  },
  {
    id: 'wizardmath',
    name: 'WizardMath',
    description: 'Specialized for mathematical problem solving',
    capabilities: ['math', 'reasoning', 'problem-solving'],
    characterLimit: 1500,
    temperature: 0.7
  },
  {
    id: 'metamath',
    name: 'MetaMath',
    description: 'Specialized for advanced mathematical reasoning and formal proofs',
    capabilities: ['math', 'reasoning', 'formal-logic'],
    characterLimit: 1500,
    temperature: 0.7
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
    
    const defaultSystemPrompt = "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer.";
    
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || defaultSystemPrompt },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: 0.7,
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
    const { model, prompt, systemPrompt } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }
    
    const defaultSystemPrompt = "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer.";
    
    res.setHeader('Content-Type', 'text/plain');
    
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || defaultSystemPrompt },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: 0.7,
      },
      stream: true
    }, {
      responseType: 'stream'
    });
    
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const data = JSON.parse(line);
          if (data.message?.content) {
            res.write(data.message.content);
          }
        }
      } catch (error) {
        console.error('Error parsing streaming chunk:', error);
      }
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.end();
    });
  } catch (error) {
    console.error('Error in streaming chat endpoint:', error);
    res.status(500).json({ error: 'Failed to get streaming response from model' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Available models:');
  models.forEach(model => {
    console.log(`- ${model.name} (${model.id}): ${model.description}`);
  });
});
