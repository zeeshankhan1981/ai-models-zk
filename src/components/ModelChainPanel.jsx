import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './ModelChainPanel.css';

const ModelChainPanel = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState({ gemma: '', mistral: '', zephyr: '', llama3: '' });
  const [finalOutput, setFinalOutput] = useState('');
  const [error, setError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [activeModelIndex, setActiveModelIndex] = useState(-1);
  const [showModelDetails, setShowModelDetails] = useState(null);
  const CHARACTER_LIMIT = 200;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Model chain configuration
  const modelChain = [
    { 
      id: 'gemma', 
      name: 'Gemma 2B', 
      role: 'Ideas', 
      description: 'Generates initial angles and ideas',
      icon: '💡',
      color: '#4285F4' // Google blue
    },
    { 
      id: 'mistral', 
      name: 'Mistral', 
      role: 'Structure', 
      description: 'Creates logical outline and structure',
      icon: '🏗️',
      color: '#5E35B1' // Deep purple
    },
    { 
      id: 'zephyr', 
      name: 'Zephyr 7B', 
      role: 'Draft', 
      description: 'Transforms outline into engaging prose',
      icon: '✏️',
      color: '#00796B' // Teal
    },
    { 
      id: 'llama3', 
      name: 'LLaMA 3', 
      role: 'Polish', 
      description: 'Expands and refines into final article',
      icon: '✨',
      color: '#FB8C00' // Orange
    }
  ];

  // Load history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('modelChainHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading model chain history:', error);
      localStorage.removeItem('modelChainHistory');
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newArticle) => {
    try {
      const updatedHistory = [...history, newArticle];
      setHistory(updatedHistory);
      localStorage.setItem('modelChainHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving model chain history:', error);
    }
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('modelChainHistory');
  };

  // Export article as a text file
  const exportArticle = () => {
    try {
      if (!finalOutput) return;
      
      let articleText = `Topic: ${topic}\n\n`;
      articleText += `Gemma (Ideas):\n${outputs.gemma}\n\n`;
      articleText += `Mistral (Outline):\n${outputs.mistral}\n\n`;
      articleText += `Zephyr (Draft):\n${outputs.zephyr}\n\n`;
      articleText += `LLaMA 3 (Final Article):\n${finalOutput}\n\n`;
      
      const blob = new Blob([articleText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `article-${topic.slice(0, 20)}-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting article:', error);
    }
  };

  const handleInputChange = (e) => {
    setTopic(e.target.value);
    setCharacterCount(e.target.value.length);
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');
    setOutputs({ gemma: '', mistral: '', zephyr: '', llama3: '' });
    setFinalOutput('');
    setActiveModelIndex(0); // Start with the first model
    console.log('Sending request to model chain endpoint with topic:', topic);

    try {
      // Simulate the progress through each model for UI demonstration
      // In a real implementation, you would get this data from the API response
      const simulateModelProgress = async () => {
        for (let i = 0; i < modelChain.length; i++) {
          setActiveModelIndex(i);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate model processing time
        }
      };

      // Start the simulation in parallel with the actual API call
      simulateModelProgress();

      // Use the same base URL pattern as the ChatInterface component (with full URL)
      const response = await axios.post('http://localhost:3001/api/chain/gemma-mistral-zephyr-llama3', { topic });
      console.log('Received response:', response.data);
      setOutputs(response.data.stages);
      setFinalOutput(response.data.finalOutput);
      setActiveModelIndex(-1); // Reset active model when complete
      
      // Save to history
      saveHistory({
        topic,
        timestamp: new Date().toISOString(),
        outputs: response.data.stages,
        finalOutput: response.data.finalOutput
      });
    } catch (err) {
      console.error('Error details:', err.response ? err.response.data : err.message);
      setError(`An error occurred: ${err.response ? err.response.data.error : err.message}`);
      setActiveModelIndex(-1); // Reset active model on error
    } finally {
      setIsGenerating(false);
    }
  };

  const clearArticle = () => {
    setTopic('');
    setCharacterCount(0);
    setOutputs({ gemma: '', mistral: '', zephyr: '', llama3: '' });
    setFinalOutput('');
    setError('');
    setActiveModelIndex(-1);
    setShowModelDetails(null);
  };

  // Determine if a model has output
  const hasOutput = (modelId) => {
    return outputs[modelId] && outputs[modelId].trim() !== '';
  };

  // Get the status of a model in the chain
  const getModelStatus = (index) => {
    if (!isGenerating) {
      if (hasOutput(modelChain[index].id)) return 'complete';
      return 'pending';
    }
    
    if (index < activeModelIndex) return 'complete';
    if (index === activeModelIndex) return 'active';
    return 'pending';
  };

  // Toggle model details popup
  const toggleModelDetails = (index) => {
    if (showModelDetails === index) {
      setShowModelDetails(null);
    } else {
      setShowModelDetails(index);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={chatContainerRef}>
        {!finalOutput && !outputs.gemma && !isGenerating ? (
          <motion.div 
            className="empty-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3>Generate an Article</h3>
            <p>Enter a topic below to generate a comprehensive article using our AI model chain</p>
            <div className="model-chain-illustration">
              {modelChain.map((model, index) => (
                <div key={model.id} className="illustration-model">
                  <div className="illustration-icon" style={{ backgroundColor: model.color }}>
                    {model.icon}
                  </div>
                  <div className="illustration-label">{model.role}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3>Error</h3>
                <p>{error}</p>
              </motion.div>
            )}
            
            {outputs.gemma && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    <span className="model-emoji">{modelChain[0].icon}</span> Gemma <span className="model-badge">Ideas Generation</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{outputs.gemma}</p>
                </div>
              </motion.div>
            )}
            
            {outputs.mistral && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    <span className="model-emoji">{modelChain[1].icon}</span> Mistral <span className="model-badge">Outline Creation</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{outputs.mistral}</p>
                </div>
              </motion.div>
            )}
            
            {outputs.zephyr && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    <span className="model-emoji">{modelChain[2].icon}</span> Zephyr <span className="model-badge">Draft Writing</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{outputs.zephyr}</p>
                </div>
              </motion.div>
            )}
            
            {finalOutput && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="message assistant-message final-output"
              >
                <div className="message-header">
                  <div className="message-role">
                    <span className="model-emoji">{modelChain[3].icon}</span> LLaMA 3 <span className="model-badge">Final Article</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{finalOutput}</p>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input-wrapper" onSubmit={handleGenerate}>
          <textarea
            className="chat-textarea"
            placeholder="Enter a topic for your article..."
            value={topic}
            onChange={handleInputChange}
            disabled={isGenerating}
            style={{ height: 'auto', minHeight: '24px', maxHeight: '150px' }}
          />
          
          <motion.button 
            type="submit" 
            className="send-button" 
            disabled={!topic.trim() || characterCount > CHARACTER_LIMIT || isGenerating}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isGenerating ? (
              <span className="generating-text">
                <span className="dot-animation">Generating</span>
              </span>
            ) : (
              'Generate Article'
            )}
          </motion.button>
        </form>
        
        <div className="chat-options">
          <span className={`character-count ${characterCount > CHARACTER_LIMIT ? 'limit-exceeded' : ''}`}>
            {characterCount}/{CHARACTER_LIMIT}
          </span>
          
          <div className="action-buttons">
            <motion.button 
              className="action-button" 
              onClick={exportArticle}
              disabled={!finalOutput}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Save Article
            </motion.button>
            
            <motion.button 
              className="action-button clear-button" 
              onClick={clearArticle}
              disabled={!finalOutput && !outputs.gemma}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Article
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to adjust color brightness
function adjustColor(hex, percent) {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Adjust brightness
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default ModelChainPanel;
