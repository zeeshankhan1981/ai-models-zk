import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Import api.js using ES modules
import { models, getResponse, streamResponse, checkModelAvailability, getAvailableModels, runModelChain } from './server/api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/models');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

app.get('/api/models/available', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/models/check');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching available models:', error);
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
});

app.get('/api/chain/gemma-mistral-zephyr-llama3', async (req, res) => {
  const { topic } = req.query;
  
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }
  
  try {
    const result = await runModelChain(topic);
    res.json(result);
  } catch (error) {
    console.error('Error in model chain:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/models/:modelId/available', async (req, res) => {
  const { modelId } = req.params;
  
  try {
    const isAvailable = await checkModelAvailability(modelId);
    res.json({ available: isAvailable });
  } catch (error) {
    console.error(`Error checking availability for model ${modelId}:`, error);
    res.status(500).json({ error: 'Failed to check model availability' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, model } = req.body;
  
  if (!message || !model) {
    return res.status(400).json({ error: 'Message and model are required' });
  }
  
  try {
    const response = await getResponse(message, model);
    res.json({ response });
  } catch (error) {
    console.error('Error getting response:', error);
    const errorMessage = error.message || 'Failed to get response';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  const { message, model } = req.body;
  
  if (!message || !model) {
    return res.status(400).json({ error: 'Message and model are required' });
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    await streamResponse(message, model, res);
    res.end();
  } catch (error) {
    console.error('Error streaming response:', error);
    const errorMessage = error.message || 'Failed to stream response';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});
