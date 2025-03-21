import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Import api.js using CommonJS compatibility approach
import pkg from './server/api.js';
const { models, getResponse, streamResponse, checkModelAvailability, getAvailableModels } = pkg;

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
app.get('/api/models', (req, res) => {
  res.json(models);
});

app.get('/api/models/available', async (req, res) => {
  try {
    const availableModels = await getAvailableModels();
    res.json(availableModels);
  } catch (error) {
    console.error('Error fetching available models:', error);
    res.status(500).json({ error: 'Failed to fetch available models' });
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

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`AverroesMind server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});
