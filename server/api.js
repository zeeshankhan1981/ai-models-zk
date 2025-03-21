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
    temperature: 0.7,
    requiresGPU: true,
    systemPrompt: "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer."
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Specialized for code generation and understanding',
    capabilities: ['code', 'reasoning', 'math'],
    characterLimit: 1500,
    temperature: 0.5,
    requiresGPU: true,
    systemPrompt: "You are DeepSeek, a helpful and precise assistant specialized in coding and technical topics. Always provide accurate, relevant, and focused responses. Keep your answers concise and on-topic. For code questions, provide clean, well-commented code examples. For technical explanations, be clear and accurate. Avoid hallucinations or making up information. If you're unsure about something, admit it rather than guessing."
  },
  {
    id: 'starcoder2',
    name: 'StarCoder2',
    description: 'Advanced code generation and completion',
    capabilities: ['code', 'programming', 'documentation'],
    characterLimit: 1500,
    temperature: 0.7,
    requiresGPU: true,
    systemPrompt: "You are StarCoder2, an expert coding assistant. Focus on providing clean, efficient, and well-structured code. Include helpful comments and explain your approach briefly. Keep responses concise and focused on the coding task at hand."
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    description: 'A balanced model with good instruction following capabilities',
    capabilities: ['general', 'reasoning', 'creative'],
    characterLimit: 1500,
    temperature: 0.7,
    requiresGPU: false,
    systemPrompt: "You are Zephyr, a helpful and creative assistant. Provide thoughtful and balanced responses. Keep your answers concise but insightful. Focus on being helpful while avoiding unnecessary verbosity."
  },
  {
    id: 'phi2',
    name: 'Phi-2',
    description: 'A small but powerful model for general tasks',
    capabilities: ['general', 'instruction', 'efficiency'],
    characterLimit: 1500,
    temperature: 0.7,
    requiresGPU: false,
    systemPrompt: "You are Phi-2, a compact but powerful assistant. Provide concise, accurate responses without unnecessary details. Be direct and to the point while remaining helpful and friendly."
  },
  {
    id: 'wizardmath',
    name: 'WizardMath',
    description: 'Specialized for mathematical problem solving',
    capabilities: ['math', 'reasoning', 'problem-solving'],
    characterLimit: 1500,
    temperature: 0.7,
    requiresGPU: true,
    systemPrompt: "You are WizardMath, a specialized mathematics assistant. Focus on providing clear, step-by-step solutions to math problems. Be precise with mathematical notation and explanations. Verify your calculations before providing answers."
  },
  {
    id: 'metamath',
    name: 'MetaMath',
    description: 'Specialized for advanced mathematical reasoning and formal proofs',
    capabilities: ['math', 'reasoning', 'formal-logic'],
    characterLimit: 1500,
    temperature: 0.7,
    requiresGPU: true,
    systemPrompt: "You are MetaMath, an expert in advanced mathematics and formal logic. Provide rigorous, well-structured mathematical proofs and explanations. Be precise with mathematical notation and reasoning. Focus on clarity and correctness in all mathematical discussions."
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
    const defaultSystemPrompt = "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer.";
    
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || selectedModel?.systemPrompt || defaultSystemPrompt },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: selectedModel?.temperature || 0.7,
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
    
    // Find the selected model
    const selectedModel = models.find(m => m.id === model);
    const defaultSystemPrompt = "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer.";
    
    res.setHeader('Content-Type', 'text/plain');
    
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt || selectedModel?.systemPrompt || defaultSystemPrompt },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: selectedModel?.temperature || 0.7,
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
