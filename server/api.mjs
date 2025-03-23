import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3001;

// Map to track active requests by requestId
const activeRequests = new Map();

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
export const models = [
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
    systemPrompt: "You are an expert programming assistant specialized in code generation and software development. Focus exclusively on providing detailed, efficient, and well-structured code solutions. When asked about code or programming concepts, provide thorough explanations with examples. If asked about non-programming topics, politely explain that you're specialized in software development and can best help with programming-related questions. Always include proper comments and documentation in your code."
  },
  {
    id: 'zephyr-7b:latest',
    name: 'Zephyr 7B',
    description: 'Zephyr 7B is a refined language model specifically tuned for conversational AI and instruction following. Built upon the Mistral 7B architecture, it has been further enhanced through RLHF (Reinforcement Learning from Human Feedback) to produce more helpful, harmless, and honest responses. Zephyr excels at natural dialogue, creative writing, and providing thoughtful answers to complex questions while maintaining a conversational tone.',
    shortDescription: 'Conversational model with enhanced instruction following capabilities',
    tags: ['Conversational', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, conversational AI assistant. Focus on providing clear, concise, and helpful responses. Maintain a friendly yet professional tone. When unsure, ask for clarification rather than making assumptions."
  },
  {
    id: 'phi-2:latest',
    name: 'Phi-2',
    description: 'Phi-2 is a powerful language model optimized for code generation and natural language understanding. It excels at generating high-quality code across multiple programming languages while maintaining excellent performance on general text tasks.',
    shortDescription: 'Specialized for code generation with good general performance',
    tags: ['Coding', 'General', 'CPU-Optimized'],
    temperature: 0.5,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a versatile AI assistant capable of both code generation and general conversation. When generating code, provide clear, well-documented solutions. For general tasks, maintain a helpful and informative tone."
  },
  {
    id: 'metamath:latest',
    name: 'MetaMath',
    description: 'MetaMath is a specialized model designed for mathematical reasoning and formal proofs. It excels at solving complex mathematical problems, verifying proofs, and explaining mathematical concepts in detail.',
    shortDescription: 'Specialized for mathematical reasoning and formal proofs',
    tags: ['Mathematics', 'Reasoning', 'CPU-Optimized'],
    temperature: 0.3,  // Lower temperature for more precise mathematical reasoning
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a specialized mathematical assistant focused on solving complex mathematical problems and verifying proofs. Provide clear, step-by-step solutions with detailed explanations."
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
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible while being safe. Your answers should be informative, ethical, and appropriate for all audiences. If a question is unclear or lacks specific details, ask for clarification rather than making assumptions. If you don't know the answer to a question, simply state that you don't know rather than making up information. Do not provide harmful, unethical, or illegal content."
  },
  {
    id: 'llama3:latest',
    name: 'Llama 3 8B',
    description: 'Llama 3 is an advanced large language model with 8 billion parameters, offering enhanced capabilities in content generation, summarization, and complex reasoning tasks. It builds upon the success of Llama 2 with improved performance and safety features.',
    shortDescription: 'Advanced 8B model for complex tasks',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a highly capable AI assistant that excels at complex reasoning tasks. Provide clear, detailed explanations for your answers. Always maintain a professional and helpful tone."
  },
  {
    id: 'gemma:2b',
    name: 'Gemma 2B',
    description: 'Gemma 2B is a specialized model designed for generating creative article ideas and outlines. It excels at brainstorming topics and structuring content in a way that is both engaging and informative.',
    shortDescription: 'Specialized for creative article generation',
    tags: ['Creativity', 'Article Generation', 'CPU-Optimized'],
    temperature: 0.8,  // Higher temperature for more creative outputs
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    characterLimit: 24000,
    requiresGPU: false,
    systemPrompt: "You are a creative article generator. Your primary task is to generate engaging article ideas and outlines. Focus on creating unique, interesting topics and well-structured outlines that will capture readers' attention."
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

// Helper function to format model output for better markdown rendering
const formatModelOutput = (output, modelType) => {
  let formattedOutput = output.trim();
  
  // Format based on model type
  switch (modelType) {
    case 'gemma:2b':
      // Ensure ideas are properly formatted with markdown
      if (!formattedOutput.includes('**')) {
        // If no markdown formatting exists, add it
        const ideas = formattedOutput.split(/\n+/).filter(line => line.trim());
        if (ideas.length > 0) {
          formattedOutput = ideas.map((idea, index) => `**${index + 1}.** ${idea.replace(/^\d+\.?\s*/, '')}`).join('\n\n');
        }
      }
      break;
      
    case 'mistral:latest':
      // Ensure outline has proper heading structure
      if (!formattedOutput.includes('##')) {
        const lines = formattedOutput.split(/\n+/);
        const formattedLines = lines.map(line => {
          // Convert main headings
          if (/^[IVX]+\.\s/.test(line)) {
            return `## ${line}`;
          }
          // Convert subheadings
          else if (/^[A-Z]\.\s/.test(line)) {
            return `### ${line}`;
          }
          // Convert numbered points
          else if (/^\d+\.\s/.test(line)) {
            return `- ${line}`;
          }
          return line;
        });
        formattedOutput = formattedLines.join('\n\n');
      }
      break;
      
    case 'zephyr-7b:latest':
      // Ensure paragraphs are properly spaced
      formattedOutput = formattedOutput.replace(/\n{3,}/g, '\n\n');
      
      // Add emphasis to important phrases
      formattedOutput = formattedOutput.replace(/(important|key|critical|essential|significant)/gi, '**$1**');
      break;
      
    case 'llama3:latest':
      // Ensure headings are properly formatted
      formattedOutput = formattedOutput.replace(/^(#+)\s*([^\n]+)/gm, '$1 $2');
      
      // Ensure paragraphs are properly spaced
      formattedOutput = formattedOutput.replace(/\n{3,}/g, '\n\n');
      
      // Add horizontal rules between major sections if not present
      if (!formattedOutput.includes('---')) {
        formattedOutput = formattedOutput.replace(/\n(#+\s[^\n]+)\n/g, '\n\n---\n\n$1\n\n');
      }
      break;
      
    default:
      // No special formatting
      break;
  }
  
  return formattedOutput;
};

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

// Endpoint for model chaining
app.post('/api/chain/gemma-mistral-zephyr-llama3', async (req, res) => {
  console.log('Model chain endpoint called with topic:', req.body.topic);
  try {
    const { topic } = req.body;
    if (typeof topic !== 'string' || topic.length > 200) {
      return res.status(400).json({ error: 'Invalid input: topic must be a string with a maximum length of 200 characters.' });
    }

    const result = await runModelChain(topic);
    res.json(result);
  } catch (error) {
    console.error('Error in model chain request:', error);
    res.status(500).json({ error: 'An unexpected error occurred during model chaining.' });
  }
});

// Function to run the model chain
const runModelChain = async (topic) => {
  try {
    // Step 1: Gemma - Ideas Generation
    if (!sendEvent('modelStart', { model: 'gemma:2b', stage: 'ideas' })) {
      throw new Error('Failed to start Gemma model');
    }
    const ideas = await queryModel('gemma:2b', `Generate 5 creative article ideas about: ${topic}`);
    sendEvent('modelComplete', { model: 'gemma:2b', stage: 'ideas', result: ideas });

    // Step 2: Mistral - Research Outline
    if (!sendEvent('modelStart', { model: 'mistral:latest', stage: 'outline' })) {
      throw new Error('Failed to start Mistral model');
    }
    const outline = await queryModel('mistral:latest', `Create a detailed research outline for: ${topic}. Use the following ideas as inspiration: ${ideas}`);
    sendEvent('modelComplete', { model: 'mistral:latest', stage: 'outline', result: outline });

    // Step 3: Zephyr - Content Generation
    if (!sendEvent('modelStart', { model: 'zephyr-7b:latest', stage: 'content' })) {
      throw new Error('Failed to start Zephyr model');
    }
    const content = await queryModel('zephyr-7b:latest', `Write a comprehensive article about: ${topic}. Follow this outline: ${outline}`);
    sendEvent('modelComplete', { model: 'zephyr-7b:latest', stage: 'content', result: content });

    // Step 4: Llama3 - Quality Check
    if (!sendEvent('modelStart', { model: 'llama3:latest', stage: 'quality' })) {
      throw new Error('Failed to start Llama3 model');
    }
    const qualityCheck = await queryModel('llama3:latest', `Review this article about ${topic} and provide feedback on its quality: ${content}`);
    sendEvent('modelComplete', { model: 'llama3:latest', stage: 'quality', result: qualityCheck });

    sendEvent('complete', { topic, ideas, outline, content, qualityCheck });
    return {
      ideas,
      outline,
      content,
      qualityCheck
    };
  } catch (error) {
    console.error('Error in model chain:', error);
    throw error;
  }
};

// Function to trim text to 750 words
function trimTo750Words(text) {
  const words = text.split(/\s+/);
  if (words.length <= 750) return text;
  
  // If we need to trim, try to find a good sentence ending
  const trimmed = words.slice(0, 750).join(' ');
  
  // Look for the last sentence ending (., !, ?)
  const lastPeriod = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? ')
  );
  
  if (lastPeriod !== -1 && lastPeriod > trimmed.length * 0.8) {
    // Only trim at sentence boundary if we're at least 80% into the text
    return trimmed.substring(0, lastPeriod + 1);
  }
  
  return trimmed;
}

// Function to perform a quality check on the generated article
async function performQualityCheck(article, topic, requestObj = null) {
  try {
    // Check if the request has been cancelled
    if (requestObj && requestObj.cancelled) {
      return '';
    }
    
    const prompt = `You are a quality assurance editor. Evaluate the following article on "${topic}" for:
1. Clarity and coherence
2. Structure and organization
3. Persuasiveness
4. Grammar and style

Provide a brief (2-3 sentence) assessment of the article's strengths and any areas for improvement.

Article:
${article}`;

    const response = await queryModel('mistral:latest', prompt, requestObj);
    return response;
  } catch (error) {
    console.error('Error performing quality check:', error);
    return 'Unable to perform quality check due to an error.';
  }
}

// Function to query a model with a prompt
async function queryModel(modelId, prompt, requestObj = null) {
  // Define model-specific parameters
  const modelParams = {
    'gemma:2b': {
      temperature: 0.6,
      top_p: 0.9,
      top_k: 40,
      num_predict: 256 // Shorter output for initial ideas
    },
    'mistral:latest': {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 512 // Medium length for outline
    },
    'zephyr-7b:latest': {
      temperature: 0.75,
      top_p: 0.9,
      top_k: 40,
      num_predict: 768 // Longer for draft
    },
    'llama3:latest': {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 1536 // Reduced from 2048 to target ~750 words
    }
  };

  // Use model-specific parameters or fallback to defaults
  const params = modelParams[modelId] || {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512
  };

  try {
    const axiosController = new AbortController();
    const response = await axios.post(`${OLLAMA_API}/chat`, {
      model: modelId,
      messages: [{ role: 'system', content: SYSTEM_PROMPTS[modelId] }, { role: 'user', content: prompt }],
      options: {
        ...params,
        ...CPU_OPTIMIZATION,
      },
      stream: false
    }, {
      signal: axiosController.signal,
      timeout: 60000 // 60 second timeout
    });
    
    if (requestObj) {
      requestObj.axiosController = axiosController;
    }
    
    return response.data.message.content.trim();
  } catch (error) {
    console.error(`Error querying model ${modelId}:`, error.message);
    throw new Error(`Failed to generate content with ${modelId}: ${error.message}`);
  }
}

// Hardcoded system prompts for each model
const SYSTEM_PROMPTS = {
  'gemma:2b': 'You generate brief, topical article ideas. Be creative and diverse in your suggestions.',
  'mistral:latest': 'You are a structured researcher creating outlines with clear thesis, supporting arguments, and evidence.',
  'zephyr-7b:latest': 'You rewrite text for tone, persuasion, and human readability. Focus on creating a coherent flow between paragraphs.',
  'llama3:latest': 'You are a seasoned editorial writer producing fully polished articles. Your articles must be concise (maximum 750 words), persuasive, and have excellent structure with a clear thesis, supporting arguments, and memorable conclusion.'
};

// Endpoint to cancel an ongoing generation
app.get('/api/chain/cancel', (req, res) => {
  const { requestId } = req.query;
  
  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }
  
  if (activeRequests.has(requestId)) {
    console.log(`Cancelling request: ${requestId}`);
    const request = activeRequests.get(requestId);
    
    // Mark the request as cancelled
    request.cancelled = true;
    
    // If there's an active axios request, cancel it
    if (request.axiosController) {
      request.axiosController.abort();
    }
    
    // Remove from active requests
    activeRequests.delete(requestId);
    
    return res.json({ success: true, message: 'Request cancelled successfully' });
  } else {
    return res.status(404).json({ error: 'Request not found or already completed' });
  }
});

// Add streaming endpoint for model chain
app.get('/api/chain/stream', async (req, res) => {
  try {
    const { topic } = req.query;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Generate a unique request ID
    const requestId = Date.now().toString();
    
    // Create a request object to track this request
    const requestObj = {
      id: requestId,
      cancelled: false,
      axiosController: null,
      response: res
    };
    
    // Add to active requests
    activeRequests.set(requestId, requestObj);
    
    // Send the request ID to the client
    res.write(`event: requestId\n`);
    res.write(`data: ${JSON.stringify({ requestId })}\n\n`);
    
    // Helper function to send SSE events
    const sendEvent = (eventType, data) => {
      // Check if request was cancelled before sending
      if (requestObj.cancelled) {
        return false;
      }
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    };
    
    // Start the model chain process
    try {
      // Step 1: Gemma - Ideas Generation
      if (!sendEvent('modelStart', { model: 'gemma:2b', stage: 'ideas' })) {
        return res.end();
      }
      
      const gemmaPrompt = `List 5 angles for an article on: ${topic}`;
      const gemma = await queryModel('gemma:2b', gemmaPrompt, requestObj);
      
      // Check if request was cancelled during model query
      if (requestObj.cancelled) {
        return res.end();
      }
      
      const formattedGemma = formatModelOutput(gemma, 'gemma:2b');
      if (!sendEvent('modelComplete', { model: 'gemma:2b', output: formattedGemma, stage: 'ideas' })) {
        return res.end();
      }
      
      // Step 2: Mistral - Outline Creation
      if (!sendEvent('modelStart', { model: 'mistral:latest', stage: 'outline' })) {
        return res.end();
      }
      
      const mistralPrompt = `Pick one of the following ideas and create a structured outline with key arguments and examples:\n${formattedGemma}`;
      const mistral = await queryModel('mistral:latest', mistralPrompt, requestObj);
      
      // Check if request was cancelled during model query
      if (requestObj.cancelled) {
        return res.end();
      }
      
      const formattedMistral = formatModelOutput(mistral, 'mistral:latest');
      if (!sendEvent('modelComplete', { model: 'mistral:latest', output: formattedMistral, stage: 'outline' })) {
        return res.end();
      }
      
      // Step 3: Zephyr - Draft Writing
      if (!sendEvent('modelStart', { model: 'zephyr-7b:latest', stage: 'draft' })) {
        return res.end();
      }
      
      const zephyrPrompt = `Transform this outline into a persuasive op-ed with emotional clarity and logical flow:\n${formattedMistral}`;
      const zephyr = await queryModel('zephyr-7b:latest', zephyrPrompt, requestObj);
      
      // Check if request was cancelled during model query
      if (requestObj.cancelled) {
        return res.end();
      }
      
      const formattedZephyr = formatModelOutput(zephyr, 'zephyr-7b:latest');
      if (!sendEvent('modelComplete', { model: 'zephyr-7b:latest', output: formattedZephyr, stage: 'draft' })) {
        return res.end();
      }
      
      // Step 4: LLaMA 3 - Final Article
      if (!sendEvent('modelStart', { model: 'llama3:latest', stage: 'final' })) {
        return res.end();
      }
      
      const llama3Prompt = `You are a seasoned editorial writer.

Write an engaging op-ed based on the draft below. Improve clarity, structure, and tone. The final piece must:
- Be **no more than 750 words**
- Have a clear thesis and three supporting arguments
- End with a memorable conclusion
- Use persuasive language throughout
- Use proper markdown formatting with headings, emphasis, and well-structured paragraphs

Rewrite the following:

${formattedZephyr}`;
      const llama3 = await queryModel('llama3:latest', llama3Prompt, requestObj);
      
      // Check if request was cancelled during model query
      if (requestObj.cancelled) {
        return res.end();
      }
      
      // Post-process to ensure we don't exceed 750 words
      const trimmedOutput = trimTo750Words(llama3);
      const formattedLlama3 = formatModelOutput(trimmedOutput, 'llama3:latest');
      
      // Optional: Add a quality check step
      if (!sendEvent('modelStart', { model: 'mistral:latest', stage: 'quality' })) {
        return res.end();
      }
      
      const qualityCheck = await performQualityCheck(formattedLlama3, topic, requestObj);
      
      // Check if request was cancelled during quality check
      if (requestObj.cancelled) {
        return res.end();
      }
      
      if (!sendEvent('modelComplete', { 
        model: 'llama3:latest', 
        output: formattedLlama3, 
        stage: 'final',
        wordCount: formattedLlama3.split(/\s+/).length,
        qualityCheck: qualityCheck
      })) {
        return res.end();
      }
      
      // Send completion event
      sendEvent('complete', { 
        finalOutput: formattedLlama3,
        stages: { 
          gemma: formattedGemma, 
          mistral: formattedMistral, 
          zephyr: formattedZephyr, 
          llama3: formattedLlama3 
        },
        qualityCheck
      });
      
    } catch (error) {
      console.error('Error in model chain:', error);
      sendEvent('error', { message: error.message || 'Unknown error in model chain' });
    } finally {
      // Remove from active requests
      activeRequests.delete(requestId);
      // End the response
      res.end();
    }
    
  } catch (error) {
    console.error('Error in stream chain endpoint:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Available models:');
  models.forEach(model => {
    console.log(`- ${model.name} (${model.id}): ${model.description}`);
  });
});

export const checkModelAvailability = async (modelId) => {
  try {
    const tagsResponse = await axios.get(`${OLLAMA_API}/tags`);
    const tags = tagsResponse.data.tags;
    return tags.some(tag => tag.name === modelId);
  } catch (error) {
    console.error('Error checking model availability:', error);
    return false;
  }
};

export const getAvailableModels = async () => {
  try {
    const tagsResponse = await axios.get(`${OLLAMA_API}/tags`);
    const tags = tagsResponse.data.tags;
    
    return models.map(model => ({
      ...model,
      available: tags.some(tag => tag.name === model.id)
    }));
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
};

export const getResponse = async (message, model) => {
  try {
    const response = await axios.post(`${OLLAMA_API}/generate`, {
      model: model,
      prompt: message,
      temperature: 0.7,
      max_tokens: 512,
      stream: false
    });
    
    return response.data.response;
  } catch (error) {
    console.error('Error getting response:', error);
    throw error;
  }
};

export const streamResponse = async (message, model, res) => {
  try {
    const response = await axios.post(`${OLLAMA_API}/generate`, {
      model: model,
      prompt: message,
      temperature: 0.7,
      max_tokens: 512,
      stream: true
    }, {
      responseType: 'stream'
    });
    
    response.data.on('data', (chunk) => {
      const data = JSON.parse(chunk.toString());
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
    
    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
  } catch (error) {
    console.error('Error streaming response:', error);
    throw error;
  }
};

export { runModelChain };
