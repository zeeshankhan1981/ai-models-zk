const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3001;

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

// Define model ports
const MODEL_PORTS = {
  mistral: 11434,
  deepseek: 11434,
  starcoder2: 11434,
  'zephyr-7b': 11434,
  metamath: 11434,
  'phi-2': 11434
};

// Function to get the port for a specific model
const getModelPort = (modelId) => {
  return MODEL_PORTS[modelId] || 11434;
};

// Define available models
const models = [
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral 7B is a state-of-the-art language model with 7 billion parameters, offering an excellent balance between performance and efficiency. It excels at general-purpose tasks including summarization, question answering, and creative writing, while maintaining fast inference speeds on consumer hardware.',
    shortDescription: 'A well-balanced 7B model for general tasks with excellent instruction following',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 1000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible while being safe. Your answers should be informative, ethical, and appropriate for all audiences. If a question is unclear or lacks specific details, ask for clarification rather than making assumptions. If you don't know the answer to a question, simply state that you don't know rather than making up information. Do not provide harmful, unethical, or illegal content."
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Coder is a specialized coding assistant trained on a vast corpus of code repositories. It excels at understanding programming concepts, generating efficient code solutions, and explaining complex algorithms. With support for over 40 programming languages including Python, JavaScript, Java, C++, and more, it can help with everything from simple scripts to complex software architecture.',
    shortDescription: 'Specialized for programming with support for 40+ languages',
    tags: ['Coding', 'Programming'],
    temperature: 0.5,  // Lower temperature for more precise code generation
    top_p: 0.95,
    top_k: 40,
    num_predict: 1024, // Higher token limit for code
    characterLimit: 1000,
    requiresGPU: false,
    systemPrompt: "You are a specialized coding assistant focused on helping with programming tasks. Provide clear, efficient, and well-documented code examples. Focus exclusively on programming-related questions and tasks. If asked about non-programming topics, politely explain that you're specialized in coding and programming. Always include comments in your code to explain complex logic, and provide explanations of how the code works when appropriate."
  },
  {
    id: 'starcoder2',
    name: 'StarCoder2',
    description: 'StarCoder2 is a cutting-edge code generation model developed by Hugging Face and ServiceNow. Built on a massive dataset of permissively licensed source code, it offers exceptional performance for code completion, generation, and understanding. With its deep knowledge of programming patterns and best practices, StarCoder2 can generate complex algorithms, refactor existing code, and provide detailed explanations of programming concepts. It runs efficiently on CPU with optimized settings.',
    shortDescription: 'Advanced code model with deep programming knowledge optimized for CPU',
    tags: ['Coding', 'Programming', 'CPU-Optimized'],
    temperature: 0.4,  // Even lower temperature for more deterministic code
    top_p: 0.95,
    top_k: 40,
    num_predict: 768, // Reduced from 1024 for better CPU performance
    characterLimit: 1000,
    requiresGPU: false, // Changed to false for CPU compatibility
    systemPrompt: "You are an expert programming assistant specialized in code generation and software development. Focus exclusively on providing detailed, efficient, and well-structured code solutions. When asked about code or programming concepts, provide thorough explanations with examples. If asked about non-programming topics, politely explain that you're specialized in software development and can best help with programming-related questions. Always include proper error handling and follow best practices for the language you're working with."
  },
  {
    id: 'zephyr-7b',
    name: 'Zephyr',
    description: 'Zephyr 7B is a refined language model specifically tuned for conversational AI and instruction following. Built upon the Mistral 7B architecture, it has been further enhanced through RLHF (Reinforcement Learning from Human Feedback) to produce more helpful, harmless, and honest responses. Zephyr excels at natural dialogue, creative writing, and providing thoughtful answers to complex questions while maintaining a conversational tone.',
    shortDescription: 'Conversational model with enhanced instruction following capabilities',
    tags: ['General', 'Instruction-following'],
    temperature: 0.8,  // Higher temperature for more creative responses
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 1000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, conversational assistant designed to provide thoughtful and engaging responses. Always be respectful, ethical, and appropriate in your answers. If you don't know something, admit it rather than making up information. If a question is unclear, ask for clarification. Avoid providing harmful, illegal, unethical or deceptive information. Focus on being helpful while maintaining safety and ethical standards."
  },
  {
    id: 'metamath',
    name: 'MetaMath',
    description: 'MetaMath is a specialized model fine-tuned for mathematical reasoning and problem-solving. Trained on a diverse collection of mathematical content including textbooks, research papers, and step-by-step solutions, it excels at breaking down complex problems into logical steps. MetaMath can handle various domains including algebra, calculus, statistics, and discrete mathematics, making it ideal for educational purposes and tackling challenging mathematical questions. It uses GPU acceleration for optimal performance.',
    shortDescription: 'Math specialist with step-by-step problem solving capabilities',
    tags: ['Math', 'Problem-solving'],
    temperature: 0.3,  // Low temperature for precise math solutions
    top_p: 0.95,
    top_k: 50,
    num_predict: 768,
    characterLimit: 1000,
    requiresGPU: true,
    systemPrompt: "You are a mathematics expert assistant focused EXCLUSIVELY on mathematical topics. You MUST ONLY respond to questions related to mathematics, such as algebra, calculus, statistics, geometry, number theory, and mathematical logic. If a user asks about ANY non-mathematical topic, politely explain that you are a specialized mathematics assistant and can only help with math-related questions. NEVER provide responses about medical issues, personal relationships, politics, or any other non-mathematical topics. Your purpose is to provide clear, step-by-step solutions to mathematical problems and explain mathematical concepts."
  },
  {
    id: 'phi-2',
    name: 'Phi-2',
    description: 'Phi-2 is a compact yet powerful 2.7 billion parameter language model developed by Microsoft Research. Despite its small size, it demonstrates remarkable reasoning capabilities and knowledge retention. Trained on a carefully curated dataset of high-quality web data and synthetic examples, Phi-2 excels at common sense reasoning, basic math, and simple coding tasks while being efficient enough to run on consumer hardware without GPU acceleration.',
    shortDescription: 'Compact but powerful model with strong reasoning capabilities',
    tags: ['General', 'Reasoning', 'Efficiency'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 1000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, concise assistant with strong reasoning capabilities. Provide clear and accurate responses to questions, focusing on being factual and logical. If you're unsure about something, acknowledge your uncertainty rather than making up information. Keep your responses concise and to the point. Always be respectful, appropriate, and ethical in your responses."
  }
];

// Function to clean model responses
function cleanModelResponse(text) {
  if (!text) {
    return "I don't have a response for that.";
  }
  
  // Remove common formatting tokens
  let cleaned = text
    .replace(/<<SYS>>.*?<<\/s>>/gs, '')
    .replace(/<\/?s>/g, '')
    .replace(/<\/?assistant>/gi, '')
    .replace(/<\/?system>/gi, '')
    .replace(/<\/?user>/gi, '')
    .replace(/\[INST\].*?\[\/INST\]/gs, '')
    .replace(/\[INST\]/g, '')
    .replace(/\[\/INST\]/g, '')
    .replace(/\[PYTHON\]/g, '')
    .replace(/\[\/PYTHON\]/g, '')
    .replace(/\[CODE\]/g, '')
    .replace(/\[\/CODE\]/g, '')
    .replace(/\[HTML\]/g, '')
    .replace(/\[\/HTML\]/g, '')
    .replace(/\[JAVASCRIPT\]/g, '')
    .replace(/\[\/JAVASCRIPT\]/g, '')
    .replace(/\[RESPONSE\]/g, '')
    .replace(/\[\/RESPONSE\]/g, '')
    .trim();
  
  // Ultra-aggressive cleaning - get only the first sentence
  // First, split by common question starters
  const questionSplits = cleaned.split(/(?:\?|(?:\.\s+|!\s+)(?:What|Where|When|Why|How|Is|Are|Can|Could|Do|Does|Did|Will|Would|Should|Has|Have|Had|May|Might))/i);
  if (questionSplits.length > 1) {
    cleaned = questionSplits[0] + (cleaned.includes('?') ? '?' : '.');
  }
  
  // If still too long, get just the first sentence
  const sentenceSplits = cleaned.split(/(?:\.\s+|\?\s+|\!\s+)/);
  if (sentenceSplits.length > 1 && cleaned.length > 100) {
    // Get the first sentence and add back the punctuation
    const punctuation = cleaned.match(/[\.\?\!]/);
    cleaned = sentenceSplits[0] + (punctuation ? punctuation[0] : '.');
  }
  
  // Remove any remaining newlines
  cleaned = cleaned.replace(/\n+/g, ' ').trim();
  
  // If the cleaned text is empty, return a default message
  if (!cleaned || cleaned.trim() === '') {
    return "I don't have a response for that.";
  }
  
  return cleaned;
}

// Add endpoint to check model availability
app.get('/api/models/check', async (req, res) => {
  try {
    // Get available models from Ollama
    const response = await axios.get(`${OLLAMA_API}/tags`);
    
    if (!response.data || !response.data.models) {
      return res.status(500).json({ error: 'Failed to get models from Ollama' });
    }
    
    const availableModels = response.data.models.map(model => model.name.split(':')[0]);
    console.log('Available models in Ollama:', availableModels);
    
    // Check which of our configured models are available
    const modelStatus = models.map(model => ({
      id: model.id,
      name: model.name,
      available: availableModels.includes(model.id)
    }));
    
    res.json({ models: modelStatus });
  } catch (error) {
    console.error('Error checking model availability:', error.message || error);
    res.status(500).json({ error: 'Failed to check model availability' });
  }
});

// Add endpoint to get available models
app.get('/api/models', (req, res) => {
  res.json({ models });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { modelId, prompt, systemPrompt } = req.body;
    
    if (!modelId || !prompt) {
      return res.status(400).json({ error: 'Model ID and prompt are required' });
    }
    
    const model = models.find(m => m.id === modelId);
    if (!model) {
      return res.status(404).json({ error: `Model ${modelId} not found` });
    }
    
    console.log(`Processing chat request for model: ${modelId}`);
    
    // Make request to Ollama
    try {
      const response = await axios.post(`${OLLAMA_API}/chat`, {
        model: modelId,
        messages: [
          {
            role: 'system',
            content: systemPrompt || model.systemPrompt || 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: model.temperature || 0.7,
          top_p: model.top_p || 0.9,
          top_k: model.top_k || 40,
          num_predict: model.num_predict || 512
        },
        ...CPU_OPTIMIZATION // Apply CPU optimization settings
      }, {
        timeout: 60000 // 60 second timeout
      });
      
      if (!response.data || !response.data.message || !response.data.message.content) {
        console.error('Empty response from model:', response.data);
        // Provide a fallback response
        return res.json({ 
          response: "I'm sorry, I couldn't generate a response. Please try again or try a different question." 
        });
      }
      
      return res.json({ response: response.data.message.content });
    } catch (apiError) {
      console.error('Ollama API error:', apiError.message);
      return res.status(500).json({ error: `Error from Ollama API: ${apiError.message}` });
    }
  } catch (error) {
    console.error('Error in chat request:', error.message || error);
    
    // Check for specific error types and provide better error messages
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Model server is not running. Please check that Ollama is started and the model is loaded.' 
      });
    }
    
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({ 
        error: error.response.data.error || 'Error from model server' 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { modelId, prompt, systemPrompt } = req.body;
    
    if (!modelId || !prompt) {
      return res.status(400).json({ error: 'Model ID and prompt are required' });
    }
    
    const model = models.find(m => m.id === modelId);
    if (!model) {
      return res.status(404).json({ error: `Model ${modelId} not found` });
    }
    
    console.log(`Processing streaming chat request for model: ${modelId}`);
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    try {
      // Make request to Ollama with streaming
      const response = await axios.post(`${OLLAMA_API}/chat`, {
        model: modelId,
        messages: [
          {
            role: 'system',
            content: systemPrompt || model.systemPrompt || 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        options: {
          temperature: model.temperature || 0.7,
          top_p: model.top_p || 0.9,
          top_k: model.top_k || 40,
          num_predict: model.num_predict || 512
        },
        ...CPU_OPTIMIZATION, // Apply CPU optimization settings
        stream: true
      }, {
        responseType: 'stream',
        timeout: 60000 // 60 second timeout
      });
      
      let hasStartedResponse = false;
      
      response.data.on('data', (chunk) => {
        try {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.message && data.message.content) {
                hasStartedResponse = true;
                res.write(data.message.content);
              }
            } catch (parseError) {
              console.error('Error parsing streaming chunk:', parseError.message);
              // If we can't parse the line, just send it as is
              if (line.trim()) {
                hasStartedResponse = true;
                res.write(line);
              }
            }
          }
        } catch (chunkError) {
          console.error('Error processing chunk:', chunkError.message);
        }
      });
      
      response.data.on('end', () => {
        if (!hasStartedResponse) {
          // If no response was sent, send a fallback
          res.write("I'm sorry, I couldn't generate a response. Please try again or try a different question.");
        }
        res.end();
      });
      
      response.data.on('error', (err) => {
        console.error('Stream error:', err.message);
        if (!hasStartedResponse) {
          res.write("I'm sorry, there was an error processing your request. Please try again.");
        }
        res.end();
      });
    } catch (apiError) {
      console.error('Ollama API streaming error:', apiError.message);
      res.write(`Error from Ollama API: ${apiError.message}`);
      res.end();
    }
  } catch (error) {
    console.error('Error in streaming chat request:', error.message || error);
    
    // Check for specific error types and provide better error messages
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Model server is not running. Please check that Ollama is started and the model is loaded.' 
      });
    }
    
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({ 
        error: error.response.data.error || 'Error from model server' 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

// Diagnostic endpoint to check model availability
app.get('/api/diagnostics', async (req, res) => {
  try {
    // Get all models from Ollama
    const tagsResponse = await axios.get(`${OLLAMA_API}/tags`);
    const availableModels = tagsResponse.data.models || [];
    
    // Check each model in our configuration
    const diagnostics = await Promise.all(models.map(async (model) => {
      const modelExists = availableModels.some(m => m.name.startsWith(model.id));
      
      let testResponse = null;
      let error = null;
      
      if (modelExists) {
        try {
          // Test the model with a simple prompt
          const response = await axios({
            method: 'post',
            url: `${OLLAMA_API}/generate`,
            data: {
              model: model.id,
              prompt: 'Hello, are you working?',
              options: {
                temperature: 0.7,
                num_predict: 50
              },
              ...CPU_OPTIMIZATION // Apply CPU optimization settings
            },
            timeout: 5000 // 5 second timeout
          });
          
          testResponse = response.data.response;
        } catch (e) {
          error = e.message;
        }
      }
      
      return {
        id: model.id,
        name: model.name,
        exists: modelExists,
        working: !!testResponse,
        testResponse,
        error
      };
    }));
    
    res.json({
      ollama: {
        available: true,
        models: availableModels.map(m => m.name)
      },
      models: diagnostics
    });
  } catch (error) {
    console.error('Error in diagnostics endpoint:', error.message);
    res.status(500).json({
      ollama: {
        available: false,
        error: error.message
      },
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        exists: false,
        working: false,
        error: 'Ollama not available'
      }))
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Available models:');
  models.forEach(model => {
    console.log(`- ${model.name} (${model.id}): ${model.description}`);
  });
});
