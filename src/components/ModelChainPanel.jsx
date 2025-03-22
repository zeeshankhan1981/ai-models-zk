import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [wordCount, setWordCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [activeModelIndex, setActiveModelIndex] = useState(-1);
  const [showModelDetails, setShowModelDetails] = useState(null);
  const [qualityCheck, setQualityCheck] = useState('');
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(null);
  const [completedStages, setCompletedStages] = useState([]);
  const [eventSource, setEventSource] = useState(null);
  
  const CHARACTER_LIMIT = 200;
  const WORD_LIMIT = 750;
  
  // Refs for scrolling
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll helper function
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      const height = chatContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      
      // Force scroll to bottom
      chatContainerRef.current.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      });
      
      // Double-check scroll position after a delay
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'auto'
          });
        }
      }, 200);
    }
  }, []);

  // Model chain configuration
  const modelChain = [
    { 
      id: 'gemma', 
      name: 'Gemma 2B', 
      role: 'Ideas', 
      description: 'Generates initial angles and ideas',
      icon: '💡',
      color: '#4285F4', // Google blue
      stage: 'ideas'
    },
    { 
      id: 'mistral', 
      name: 'Mistral', 
      role: 'Structure', 
      description: 'Creates logical outline and structure',
      icon: '🏗️',
      color: '#5E35B1', // Deep purple
      stage: 'outline'
    },
    { 
      id: 'zephyr', 
      name: 'Zephyr 7B', 
      role: 'Draft', 
      description: 'Transforms outline into engaging prose',
      icon: '✏️',
      color: '#00796B', // Teal
      stage: 'draft'
    },
    { 
      id: 'llama3', 
      name: 'LLaMA 3', 
      role: 'Polish', 
      description: 'Expands and refines into final article',
      icon: '✨',
      color: '#FB8C00', // Orange
      stage: 'final'
    },
    {
      id: 'quality',
      name: 'Quality Check',
      role: 'Review',
      description: 'Verifies article quality and coherence',
      icon: '🔍',
      color: '#9C27B0', // Purple
      stage: 'quality'
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

  // Calculate word count when final output changes
  useEffect(() => {
    if (finalOutput) {
      const words = finalOutput.trim().split(/\s+/);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [finalOutput]);

  // Scroll to bottom when new content is added
  useEffect(() => {
    scrollToBottom();
  }, [outputs, finalOutput, activeStage, completedStages, scrollToBottom]);

  // Additional scroll trigger when a model completes
  useEffect(() => {
    if (completedStages.length > 0) {
      scrollToBottom();
      
      // Force another scroll after a longer delay to ensure all content is rendered
      setTimeout(scrollToBottom, 500);
    }
  }, [completedStages, scrollToBottom]);

  // Scroll when messages are initially loaded
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Clean up event source on unmount or when generation is canceled
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

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
      articleText += `LLaMA 3 (Final Article - ${wordCount} words):\n${finalOutput}\n\n`;
      
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

  const handleStreamedGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    // Reset states
    setIsGenerating(true);
    setError('');
    setOutputs({ gemma: '', mistral: '', zephyr: '', llama3: '' });
    setFinalOutput('');
    setQualityCheck('');
    setShowQualityCheck(false);
    setActiveStage(null);
    setCompletedStages([]);
    setProgress(0);
    
    // Close any existing event source
    if (eventSource) {
      eventSource.close();
    }
    
    try {
      // Create a new event source for SSE
      const sse = new EventSource(`http://localhost:3001/api/chain/stream?topic=${encodeURIComponent(topic)}`);
      setEventSource(sse);
      
      // Handle different event types
      sse.addEventListener('modelStart', (event) => {
        const data = JSON.parse(event.data);
        console.log('Model started:', data);
        setActiveStage(data.stage);
        
        // Update progress based on which model is starting
        const stageIndex = modelChain.findIndex(model => model.stage === data.stage);
        if (stageIndex !== -1) {
          setActiveModelIndex(stageIndex);
          setProgress((stageIndex / (modelChain.length - 1)) * 100);
        }
      });
      
      sse.addEventListener('modelComplete', (event) => {
        const data = JSON.parse(event.data);
        console.log('Model completed:', data);
        
        // Update the appropriate output based on the stage
        setOutputs(prev => {
          const newOutputs = { ...prev };
          
          switch (data.stage) {
            case 'ideas':
              newOutputs.gemma = data.output;
              break;
            case 'outline':
              newOutputs.mistral = data.output;
              break;
            case 'draft':
              newOutputs.zephyr = data.output;
              break;
            case 'final':
              newOutputs.llama3 = data.output;
              setFinalOutput(data.output);
              if (data.qualityCheck) {
                setQualityCheck(data.qualityCheck);
              }
              break;
            default:
              break;
          }
          
          return newOutputs;
        });
        
        // Mark this stage as completed
        setCompletedStages(prev => [...prev, data.stage]);
      });
      
      sse.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        console.log('Generation complete:', data);
        
        // Ensure all outputs are set
        setOutputs(data.stages);
        setFinalOutput(data.finalOutput);
        if (data.qualityCheck) {
          setQualityCheck(data.qualityCheck);
        }
        
        // Reset states
        setActiveModelIndex(-1);
        setActiveStage(null);
        setProgress(100);
        
        // Save to history
        saveHistory({
          topic,
          timestamp: new Date().toISOString(),
          outputs: data.stages,
          finalOutput: data.finalOutput,
          wordCount: data.finalOutput.trim().split(/\s+/).length
        });
        
        // Close the event source
        sse.close();
        setEventSource(null);
        setIsGenerating(false);
      });
      
      sse.addEventListener('error', (event) => {
        const data = JSON.parse(event.data || '{"message": "Unknown error"}');
        console.error('Error in stream:', data);
        setError(`An error occurred: ${data.message}`);
        
        // Reset states
        setActiveModelIndex(-1);
        setActiveStage(null);
        
        // Close the event source
        sse.close();
        setEventSource(null);
        setIsGenerating(false);
      });
      
      // Handle connection errors
      sse.onerror = (error) => {
        console.error('EventSource error:', error);
        setError('Connection error. Please try again.');
        
        // Reset states
        setActiveModelIndex(-1);
        setActiveStage(null);
        
        // Close the event source
        sse.close();
        setEventSource(null);
        setIsGenerating(false);
      };
      
    } catch (err) {
      console.error('Error setting up streaming:', err);
      setError(`An error occurred: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const cancelGeneration = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsGenerating(false);
    setActiveModelIndex(-1);
    setActiveStage(null);
  };

  const toggleQualityCheck = () => {
    setShowQualityCheck(!showQualityCheck);
  };

  const clearArticle = () => {
    setTopic('');
    setCharacterCount(0);
    setWordCount(0);
    setOutputs({ gemma: '', mistral: '', zephyr: '', llama3: '' });
    setFinalOutput('');
    setQualityCheck('');
    setShowQualityCheck(false);
    setError('');
    setActiveModelIndex(-1);
    setActiveStage(null);
    setCompletedStages([]);
    setProgress(0);
    setShowModelDetails(null);
    
    // Close any existing event source
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  // Determine if a model has output
  const hasOutput = (modelId) => {
    return outputs[modelId] && outputs[modelId].trim() !== '';
  };

  // Get the status of a model in the chain
  const getModelStatus = (index) => {
    const stage = modelChain[index].stage;
    
    if (completedStages.includes(stage)) return 'complete';
    if (activeStage === stage) return 'active';
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

  // Determine if a model's output should be visible
  const isModelVisible = (index) => {
    const stage = modelChain[index].stage;
    return completedStages.includes(stage) || activeStage === stage;
  };

  return (
    <div className="chat-container">
      {/* Progress bar */}
      {isGenerating && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      
      <div className="chat-messages" ref={chatContainerRef}>
        {!finalOutput && !outputs.gemma && !isGenerating ? (
          <motion.div 
            className="empty-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3>Generate an Article</h3>
            <p>Enter a topic below to generate a concise, persuasive editorial (max 750 words)</p>
            <div className="model-chain-illustration">
              {modelChain.slice(0, 4).map((model, index) => (
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
            
            {/* Model chain status indicators */}
            {(isGenerating || outputs.gemma) && (
              <div className="model-chain-status">
                {modelChain.slice(0, 4).map((model, index) => (
                  <div 
                    key={model.id} 
                    className={`status-item ${getModelStatus(index)}`}
                    onClick={() => toggleModelDetails(index)}
                  >
                    <div className="status-icon" style={{ backgroundColor: model.color }}>
                      {model.icon}
                    </div>
                    <div className="status-label">
                      {model.role}
                      {getModelStatus(index) === 'active' && (
                        <span className="status-indicator">
                          <span className="dot-animation">Processing</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Gemma output */}
            <AnimatePresence>
              {isModelVisible(0) && (
                <motion.div
                  key="gemma-output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="message assistant-message"
                >
                  <div className="message-header">
                    <div className="message-role">
                      <span className="model-emoji">{modelChain[0].icon}</span> Gemma <span className="model-badge">Ideas Generation</span>
                    </div>
                  </div>
                  <div className="message-content">
                    {activeStage === 'ideas' && !outputs.gemma ? (
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      <p>{outputs.gemma}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Mistral output */}
            <AnimatePresence>
              {isModelVisible(1) && (
                <motion.div
                  key="mistral-output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="message assistant-message"
                >
                  <div className="message-header">
                    <div className="message-role">
                      <span className="model-emoji">{modelChain[1].icon}</span> Mistral <span className="model-badge">Outline Creation</span>
                    </div>
                  </div>
                  <div className="message-content">
                    {activeStage === 'outline' && !outputs.mistral ? (
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      <p>{outputs.mistral}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Zephyr output */}
            <AnimatePresence>
              {isModelVisible(2) && (
                <motion.div
                  key="zephyr-output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="message assistant-message"
                >
                  <div className="message-header">
                    <div className="message-role">
                      <span className="model-emoji">{modelChain[2].icon}</span> Zephyr <span className="model-badge">Draft Writing</span>
                    </div>
                  </div>
                  <div className="message-content">
                    {activeStage === 'draft' && !outputs.zephyr ? (
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      <p>{outputs.zephyr}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* LLaMA 3 output */}
            <AnimatePresence>
              {isModelVisible(3) && (
                <motion.div
                  key="llama3-output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="message assistant-message final-output"
                >
                  <div className="message-header">
                    <div className="message-role">
                      <span className="model-emoji">{modelChain[3].icon}</span> LLaMA 3 <span className="model-badge">Final Article</span>
                      {outputs.llama3 && (
                        <span className="word-count-badge">
                          <span className={wordCount > WORD_LIMIT ? 'limit-exceeded' : ''}>
                            {wordCount} / {WORD_LIMIT} words
                          </span>
                        </span>
                      )}
                    </div>
                    {qualityCheck && (
                      <div className="quality-check-toggle" onClick={toggleQualityCheck}>
                        <span>{showQualityCheck ? 'Hide' : 'Show'} Quality Check</span>
                      </div>
                    )}
                  </div>
                  {showQualityCheck && qualityCheck && (
                    <div className="quality-check">
                      <p><strong>Quality Assessment:</strong> {qualityCheck}</p>
                    </div>
                  )}
                  <div className="message-content">
                    {activeStage === 'final' && !outputs.llama3 ? (
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      <p>{outputs.llama3 || finalOutput}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} className="messages-end-ref" />
      </div>

      <div className="chat-input-container">
        <form className="chat-input-wrapper" onSubmit={handleStreamedGenerate}>
          <textarea
            className="chat-textarea"
            placeholder="What topic would you like an editorial about? (e.g., 'The ethics of AI in surveillance', 'Censorship in India', etc.)"
            value={topic}
            onChange={handleInputChange}
            disabled={isGenerating}
            style={{ height: 'auto', minHeight: '24px', maxHeight: '150px' }}
          />
          
          {isGenerating ? (
            <motion.button 
              type="button" 
              className="send-button cancel-button" 
              onClick={cancelGeneration}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel Generation
            </motion.button>
          ) : (
            <motion.button 
              type="submit" 
              className="send-button" 
              disabled={!topic.trim() || characterCount > CHARACTER_LIMIT}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Generate Article
            </motion.button>
          )}
        </form>
        
        <div className="chat-options">
          <span className={`character-count ${characterCount > CHARACTER_LIMIT ? 'limit-exceeded' : ''}`}>
            {characterCount}/{CHARACTER_LIMIT}
            <span className="limit-note">(Your article will be up to 750 words)</span>
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
              disabled={!finalOutput && !outputs.gemma && !isGenerating}
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

export default ModelChainPanel;
