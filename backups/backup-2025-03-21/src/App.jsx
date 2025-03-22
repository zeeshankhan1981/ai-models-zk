import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import ChatInterface from './components/ChatInterface';
import ModelSelector from './components/ModelSelector';
import ThemeToggle from './components/ThemeToggle';
import ModelInfo from './components/ModelInfo';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/models');
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setModels(data.models); // Updated to access the models array from the response
        
        // Set default model if none selected
        if (data.models.length > 0 && !selectedModel) { // Updated to access data.models
          const savedModelId = localStorage.getItem('selectedModel');
          const modelToSelect = savedModelId && data.models.find(m => m.id === savedModelId) 
            ? savedModelId 
            : data.models[0].id; // Updated to access data.models
          setSelectedModel(modelToSelect);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to load models. Please make sure the API server is running.');
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Handle model change
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem('selectedModel', modelId);
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Get current model
  const currentModel = models.find(model => model.id === selectedModel);

  return (
    <div className="app-container">
      <header className="app-header">
        <motion.div 
          className="app-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>LocalMind</h1>
          <span className="app-subtitle">Your personal AI hub</span>
        </motion.div>
        
        <div className="app-controls">
          <ModelSelector 
            models={models} 
            selectedModel={selectedModel} 
            onModelChange={handleModelChange} 
          />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading models...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            {currentModel && (
              <div className="model-info-container">
                <ModelInfo model={currentModel} />
              </div>
            )}
            <ChatInterface selectedModel={selectedModel} models={models} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
