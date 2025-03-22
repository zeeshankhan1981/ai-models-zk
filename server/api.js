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
  'mistral:latest': 11434,
  'deepseek:latest': 11434,
  'starcoder2:latest': 11434,
  'zephyr-7b:latest': 11434,
  'metamath:latest': 11434,
  'phi-2:latest': 11434,
  'llama2:latest': 11434,
  'llama2:chat': 11434,
  'llama3:latest': 11434,
  'gemma:2b': 11434
};

// Function to get the port for a specific model
const getModelPort = (modelId) => {
  return MODEL_PORTS[modelId] || 11434;
};

// Define available models
const models = [
  {
    id: 'mistral:latest',
    name: 'Mistral 7B',
    description: 'Mistral 7B is a state-of-the-art language model with 7 billion parameters, offering an excellent balance between performance and efficiency. It excels at general-purpose tasks including summarization, question answering, and creative writing, while maintaining fast inference speeds on consumer hardware.',
    shortDescription: 'A well-balanced 7B model for general tasks with excellent instruction following',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible while being safe. Your answers should be informative, ethical, and appropriate for all audiences. If a question is unclear or lacks specific details, ask for clarification rather than making assumptions. If you don't know the answer to a question, simply state that you don't know rather than making up information. Do not provide harmful, unethical, or illegal content."
  },
  {
    id: 'deepseek:latest',
    name: 'DeepSeek Coder 6.7B',
    description: 'DeepSeek Coder is a specialized coding assistant trained on a vast corpus of code repositories. It excels at understanding programming concepts, generating efficient code solutions, and explaining complex algorithms. With support for over 40 programming languages including Python, JavaScript, Java, C++, and more, it can help with everything from simple scripts to complex software architecture.',
    shortDescription: 'Specialized for programming with support for 40+ languages',
    tags: ['Coding', 'Programming'],
    temperature: 0.5,  // Lower temperature for more precise code generation
    top_p: 0.95,
    top_k: 40,
    num_predict: 1024, // Higher token limit for code
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a specialized coding assistant focused on helping with programming tasks. Provide clear, efficient, and well-documented code examples. Focus exclusively on programming-related questions and tasks. If asked about non-programming topics, politely explain that you're specialized in coding and programming. Always include comments in your code to explain complex logic, and provide explanations of how the code works when appropriate."
  },
  {
    id: 'starcoder2:latest',
    name: 'StarCoder2 3B',
    description: 'StarCoder2 is a cutting-edge code generation model developed by Hugging Face and ServiceNow. Built on a massive dataset of permissively licensed source code, it offers exceptional performance for code completion, generation, and understanding. With its deep knowledge of programming patterns and best practices, StarCoder2 can generate complex algorithms, refactor existing code, and provide detailed explanations of programming concepts. It runs efficiently on CPU with optimized settings.',
    shortDescription: 'Advanced code model with deep programming knowledge optimized for CPU',
    tags: ['Coding', 'Programming', 'CPU-Optimized'],
    temperature: 0.4,  // Even lower temperature for more deterministic code
    top_p: 0.95,
    top_k: 40,
    num_predict: 768, // Reduced from 1024 for better CPU performance
    characterLimit: 50000,
    requiresGPU: false, // Changed to false for CPU compatibility
    systemPrompt: "You are an expert programming assistant specialized in code generation and software development. Focus exclusively on providing detailed, efficient, and well-structured code solutions. When asked about code or programming concepts, provide thorough explanations with examples. If asked about non-programming topics, politely explain that you're specialized in software development and can best help with programming-related questions. Always include proper error handling and follow best practices for the language you're working with."
  },
  {
    id: 'zephyr-7b:latest',
    name: 'Zephyr 7B',
    description: 'Zephyr 7B is a refined language model specifically tuned for conversational AI and instruction following. Built upon the Mistral 7B architecture, it has been further enhanced through RLHF (Reinforcement Learning from Human Feedback) to produce more helpful, harmless, and honest responses. Zephyr excels at natural dialogue, creative writing, and providing thoughtful answers to complex questions while maintaining a conversational tone.',
    shortDescription: 'Conversational model with enhanced instruction following capabilities',
    tags: ['General', 'Instruction-following'],
    temperature: 0.8,  // Higher temperature for more creative responses
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, conversational assistant designed to provide thoughtful and engaging responses. Always be respectful, ethical, and appropriate in your answers. If you don't know something, admit it rather than making up information. If a question is unclear, ask for clarification. Avoid providing harmful, illegal, unethical or deceptive information. Focus on being helpful while maintaining safety and ethical standards."
  },
  {
    id: 'phi-2:latest',
    name: 'Phi-2',
    description: 'Phi-2 is a compact yet powerful 2.7 billion parameter language model developed by Microsoft Research. Despite its small size, it demonstrates remarkable reasoning capabilities and knowledge retention. Trained on a carefully curated dataset of high-quality web data and synthetic examples, Phi-2 excels at common sense reasoning, basic math, and simple coding tasks while being efficient enough to run on consumer hardware without GPU acceleration.',
    shortDescription: 'Compact but powerful model with strong reasoning capabilities',
    tags: ['General', 'Reasoning', 'Efficiency'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 6000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, concise assistant with strong reasoning capabilities. Provide clear and accurate responses to questions, focusing on being factual and logical. If you're unsure about something, acknowledge your uncertainty rather than making up information. Keep your responses concise and to the point. Always be respectful, appropriate, and ethical in your responses."
  },
  {
    id: 'metamath:latest',
    name: 'MetaMath',
    description: 'MetaMath is a specialized model fine-tuned for mathematical reasoning and problem-solving. Trained on a diverse collection of mathematical content including textbooks, research papers, and step-by-step solutions, it excels at breaking down complex problems into logical steps. MetaMath can handle various domains including algebra, calculus, statistics, and discrete mathematics, making it ideal for educational purposes and tackling challenging mathematical questions. It uses GPU acceleration for optimal performance.',
    shortDescription: 'Math specialist with step-by-step problem solving capabilities',
    tags: ['Math', 'Problem-solving'],
    temperature: 0.3,  // Low temperature for precise math solutions
    top_p: 0.95,
    top_k: 50,
    num_predict: 768,
    characterLimit: 24000,
    requiresGPU: true,
    systemPrompt: "You are a mathematics expert assistant focused EXCLUSIVELY on mathematical topics. You MUST ONLY respond to questions related to mathematics, such as algebra, calculus, statistics, geometry, number theory, and mathematical logic. If a user asks about ANY non-mathematical topic, politely explain that you are a specialized mathematics assistant and can only help with math-related questions. NEVER provide responses about medical issues, personal relationships, politics, or any other non-mathematical topics. Your purpose is to provide clear, step-by-step solutions to mathematical problems and explain mathematical concepts."
  },
  {
    id: 'llama2:latest',
    name: 'Llama 2 7B',
    description: 'Llama 2 is Meta\'s next-generation open-source large language model, offering improved performance and safety compared to its predecessor. With 7 billion parameters, it provides a good balance between capability and efficiency, making it suitable for a wide range of applications including content generation, summarization, and conversational AI. Optimized for CPU usage, it can run effectively without GPU acceleration.',
    shortDescription: 'Meta\'s versatile open-source model with balanced performance',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 12000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible while being safe. Your answers should be informative, ethical, and appropriate for all audiences. If a question is unclear or lacks specific details, ask for clarification rather than making assumptions. If you don't know the answer to a question, simply state that you don't know rather than making up information."
  },
  {
    id: 'llama3:latest',
    name: 'Llama 3 8B',
    description: 'Llama 3 is Meta\'s latest open-source large language model, offering significant improvements in reasoning, coding, and instruction following compared to Llama 2. With 8 billion parameters, it provides enhanced performance while maintaining efficiency, making it suitable for a wide range of applications including content generation, creative writing, and conversational AI.',
    shortDescription: 'Meta\'s latest model with improved reasoning and instruction following',
    tags: ['General', 'Reasoning', 'Instruction-following'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: true,
    systemPrompt: "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible while being safe. Your answers should be informative, ethical, and appropriate for all audiences. If a question is unclear or lacks specific details, ask for clarification rather than making assumptions. If you don't know the answer to a question, simply state that you don't know rather than making up information."
  },
  {
    id: 'gemma:2b',
    name: 'Gemma 2B',
    description: 'Gemma 2B is a lightweight yet capable language model developed by Google. Despite its small size of only 2 billion parameters, it offers impressive performance for general tasks, coding, and creative writing. Optimized for efficiency, it can run smoothly on consumer hardware without GPU acceleration, making it ideal for applications where resources are limited but quality responses are still required.',
    shortDescription: 'Google\'s efficient 2B model with balanced capabilities',
    tags: ['General', 'Efficiency', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 8000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible while being safe. Your answers should be informative, ethical, and appropriate for all audiences. If a question is unclear or lacks specific details, ask for clarification rather than making assumptions. If you don't know the answer to a question, simply state that you don't know rather than making up information."
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
    
    // Get the full model names from Ollama
    const availableModels = response.data.models.map(model => model.name);
    console.log('Available models in Ollama:', availableModels);
    
    // Check which of our configured models are available
    const modelStatus = models.map(model => {
      // For models with colons, check if the exact name exists
      // Otherwise, check if the base name exists (for backward compatibility)
      const isAvailable = availableModels.some(availableModel => 
        availableModel === model.id || // Exact match
        availableModel.startsWith(`${model.id}:`) || // Model with tag
        model.id.includes(':') && availableModel === model.id.split(':')[0] // Handle special case for models with colons
      );
      
      return {
        id: model.id,
        name: model.name,
        available: isAvailable
      };
    });
    
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
    console.log('Received chat request:', JSON.stringify(req.body, null, 2));
    const { modelId, prompt, messages, systemPrompt } = req.body;
    
    // Support both direct prompt and messages array
    if ((!modelId && !req.body.model) || (!prompt && (!messages || !Array.isArray(messages) || messages.length === 0))) {
      console.error('Missing required parameters:', { 
        hasModelId: !!modelId, 
        hasModel: !!req.body.model, 
        hasPrompt: !!prompt, 
        hasMessages: !!messages && Array.isArray(messages) && messages.length > 0
      });
      return res.status(400).json({ error: 'Model ID and either prompt or messages are required' });
    }
    
    // Support both modelId and model parameter names for compatibility
    const modelIdentifier = modelId || req.body.model;
    console.log(`Using model identifier: ${modelIdentifier}`);
    
    const model = models.find(m => m.id === modelIdentifier);
    if (!model) {
      console.error(`Model not found: ${modelIdentifier}`);
      console.log('Available models:', models.map(m => m.id));
      return res.status(404).json({ error: `Model ${modelIdentifier} not found` });
    }
    
    console.log(`Processing streaming chat request for model: ${modelIdentifier}`);
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    try {
      // Prepare messages for Ollama API
      let ollama_messages = [];
      
      // Add system message
      ollama_messages.push({
        role: 'system',
        content: systemPrompt || model.systemPrompt || 'You are a helpful assistant.'
      });
      
      // Add user messages from history if provided
      if (messages && Array.isArray(messages) && messages.length > 0) {
        // Filter out any messages with empty content
        ollama_messages = ollama_messages.concat(
          messages.filter(msg => msg && msg.role && msg.content)
        );
      } else if (prompt) {
        // Add single user message if no history provided
        ollama_messages.push({
          role: 'user',
          content: prompt
        });
      }
      
      console.log('Sending messages to Ollama:', JSON.stringify(ollama_messages, null, 2));
      
      // Make request to Ollama with streaming
      const response = await axios.post(`${OLLAMA_API}/chat`, {
        model: modelIdentifier,
        messages: ollama_messages,
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
            } catch (jsonError) {
              console.error('Error parsing JSON from stream:', jsonError);
            }
          }
        } catch (chunkError) {
          console.error('Error processing chunk:', chunkError);
        }
      });
      
      response.data.on('end', () => {
        if (!hasStartedResponse) {
          res.write("I'm sorry, I couldn't generate a response. Please try again or try a different question.");
        }
        res.end();
      });
      
      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        res.write("\nError during streaming response. Please try again.");
        res.end();
      });
      
    } catch (apiError) {
      console.error('Ollama API error:', apiError);
      return res.status(500).json({ error: `Error from Ollama API: ${apiError.message || 'Unknown error'}` });
    }
  } catch (error) {
    console.error('Error in chat request:', error);
    
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
