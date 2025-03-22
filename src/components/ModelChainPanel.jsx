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
  const CHARACTER_LIMIT = 200;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

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
    console.log('Sending request to model chain endpoint with topic:', topic);

    try {
      // Use the same base URL pattern as the ChatInterface component (with full URL)
      const response = await axios.post('http://localhost:3001/api/chain/gemma-mistral-zephyr-llama3', { topic });
      console.log('Received response:', response.data);
      setOutputs(response.data.stages);
      setFinalOutput(response.data.finalOutput);
      
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
  };

  return (
    <div className="chat-container">
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
