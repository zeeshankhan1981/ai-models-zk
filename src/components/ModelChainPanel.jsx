import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
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
  const CHARACTER_LIMIT = 200;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Model chain configuration
  const modelChain = [
    { id: 'gemma', name: 'Gemma 2B', role: 'Ideas', description: 'Generates initial angles and ideas' },
    { id: 'mistral', name: 'Mistral', role: 'Structure', description: 'Creates logical outline and structure' },
    { id: 'zephyr', name: 'Zephyr 7B', role: 'Draft', description: 'Transforms outline into engaging prose' },
    { id: 'llama3', name: 'LLaMA 3', role: 'Polish', description: 'Expands and refines into final article' }
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

  return (
    <div className="chat-container">
      {/* Model Chain Flow Indicator */}
      <div className="model-chain-flow">
        <h3>AI Model Chain</h3>
        <p className="chain-description">Generating high-quality content through a 4-model deterministic process</p>
        
        <div className="chain-flow-container">
          {modelChain.map((model, index) => (
            <React.Fragment key={model.id}>
              {/* Model node */}
              <div className={`chain-model ${getModelStatus(index)}`}>
                <div className="model-icon">{index + 1}</div>
                <div className="model-info">
                  <div className="model-name">{model.name}</div>
                  <div className="model-role">{model.role}</div>
                </div>
                {getModelStatus(index) === 'complete' && (
                  <div className="status-icon">✓</div>
                )}
                {getModelStatus(index) === 'active' && (
                  <div className="status-icon pulsing">●</div>
                )}
              </div>
              
              {/* Connector line between models */}
              {index < modelChain.length - 1 && (
                <div className={`chain-connector ${
                  getModelStatus(index) === 'complete' ? 'complete' : 
                  getModelStatus(index) === 'active' ? 'active' : 'pending'
                }`}>
                  <div className="connector-line"></div>
                  <div className="connector-arrow">→</div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {!finalOutput && !outputs.gemma && !isGenerating ? (
          <div className="empty-chat">
            <h3>Generate an Article</h3>
            <p>Enter a topic below to generate a comprehensive article using our AI model chain</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-message">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            )}
            
            {outputs.gemma && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    Gemma <span className="model-badge">Ideas Generation</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{outputs.gemma}</p>
                </div>
              </motion.div>
            )}
            
            {outputs.mistral && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    Mistral <span className="model-badge">Outline Creation</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{outputs.mistral}</p>
                </div>
              </motion.div>
            )}
            
            {outputs.zephyr && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    Zephyr <span className="model-badge">Draft Writing</span>
                  </div>
                </div>
                <div className="message-content">
                  <p>{outputs.zephyr}</p>
                </div>
              </motion.div>
            )}
            
            {finalOutput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="message assistant-message"
              >
                <div className="message-header">
                  <div className="message-role">
                    LLaMA 3 <span className="model-badge">Final Article</span>
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
          
          <button type="submit" className="send-button" disabled={!topic.trim() || characterCount > CHARACTER_LIMIT || isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Article'}
          </button>
        </form>
        
        <div className="chat-options">
          <span className={`character-count ${characterCount > CHARACTER_LIMIT ? 'limit-exceeded' : ''}`}>
            {characterCount}/{CHARACTER_LIMIT}
          </span>
          
          <div className="action-buttons">
            <button 
              className="action-button" 
              onClick={exportArticle}
              disabled={!finalOutput}
            >
              Save Article
            </button>
            
            <button 
              className="action-button clear-button" 
              onClick={clearArticle}
              disabled={!finalOutput && !outputs.gemma}
            >
              Clear Article
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelChainPanel;
