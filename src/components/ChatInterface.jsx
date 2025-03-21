import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatInterface.css';

const ChatInterface = ({ selectedModel, models }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Get the current model from the models array
  const currentModel = models.find(model => model.id === selectedModel) || {};
  const characterLimit = currentModel?.characterLimit || 1500;
  
  // Get theme from document
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingResponse]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const cleanModelResponse = (text) => {
    // Remove common formatting tokens from model responses
    const patterns = [
      /\[INST\].*?\[\/INST\]/gs,
      /<\/?s>/g,
      /<<SYS>>.*?<\/SYS>/gs,
      /<\|.*?\|>/g,
      /\[\/INST\]/g,
      /\[INST\]/g
    ];
    
    let cleaned = text;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned.trim();
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (input.trim() === '' || isLoading) return;
    
    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      if (useStreaming) {
        await streamResponse(userMessage.content);
      } else {
        await getResponse(userMessage.content);
      }
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
          timestamp: new Date().toISOString(),
          model: currentModel.name
        }
      ]);
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  };

  const getResponse = async (prompt) => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          systemPrompt: "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer."
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const cleanedResponse = cleanModelResponse(data.response);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: cleanedResponse,
          timestamp: new Date().toISOString(),
          model: currentModel.name
        }
      ]);
    } catch (error) {
      console.error('Error in getResponse:', error);
      throw error;
    }
  };

  const streamResponse = async (prompt) => {
    try {
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          systemPrompt: "You are a helpful, concise assistant. Keep your answers brief and to the point. Avoid unnecessary explanations or verbosity. If you're asked a simple question, provide a simple answer."
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get streaming response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        accumulatedResponse += chunk;
        setStreamingResponse(cleanModelResponse(accumulatedResponse));
      }

      // Add the complete response to messages
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: cleanModelResponse(accumulatedResponse),
          timestamp: new Date().toISOString(),
          model: currentModel.name
        }
      ]);
    } catch (error) {
      console.error('Error in streamResponse:', error);
      throw error;
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setStreamingResponse('');
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={messagesEndRef}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <h3>Start a conversation</h3>
            <p>Send a message to begin chatting with {currentModel.name}</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <motion.div 
                key={index} 
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                    {message.role === 'assistant' && message.model && (
                      <span className="model-badge">{message.model}</span>
                    )}
                  </span>
                </div>
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={isDarkMode ? oneDark : oneLight}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
              </motion.div>
            ))}
            
            {/* Streaming response */}
            <AnimatePresence>
              {streamingResponse && (
                <motion.div 
                  className="message assistant-message streaming"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-header">
                    <span className="message-role">
                      Assistant
                      <span className="model-badge">{currentModel.name}</span>
                    </span>
                  </div>
                  <div className="message-content">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={isDarkMode ? oneDark : oneLight}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {streamingResponse}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Loading indicator */}
            <AnimatePresence>
              {isLoading && !streamingResponse && (
                <motion.div 
                  className="typing-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {messages.length > 1 && (
              <motion.button 
                className="clear-history-button"
                onClick={clearHistory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear History
              </motion.button>
            )}
          </>
        )}
      </div>
      <div className="chat-input-container">
        <form className="chat-form" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentModel.name || 'Assistant'}...`}
            disabled={isLoading}
            rows={1}
            ref={textareaRef}
          />
          {input.trim() !== '' && (
            <button
              type="button"
              className="clear-button"
              onClick={() => setInput('')}
              aria-label="Clear input"
            >
              ✕
            </button>
          )}
          <div className="chat-options">
            <label className="streaming-toggle">
              <input
                type="checkbox"
                checked={useStreaming}
                onChange={() => setUseStreaming(!useStreaming)}
              />
              <span className="toggle-label">Streaming</span>
            </label>
            <span className={`character-count ${input.length >= characterLimit ? 'limit-reached' : ''}`}>
              {input.length}/{characterLimit}
            </span>
          </div>
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || input.trim() === '' || input.length > characterLimit}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
