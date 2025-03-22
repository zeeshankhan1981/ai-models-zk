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
  const [abortController, setAbortController] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_history_${selectedModel}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Only set messages if there's actual content
        if (parsedMessages && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        // If there's an error parsing, clear the corrupted storage
        localStorage.removeItem(`chat_history_${selectedModel}`);
      }
    }
  }, [selectedModel]);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`chat_history_${selectedModel}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  }, [messages, selectedModel]);

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
      if (error.name !== 'AbortError') {
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
      }
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
      setAbortController(null);
    }
  };

  const getResponse = async (prompt) => {
    try {
      const controller = new AbortController();
      setAbortController(controller);
      
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt
        }),
        signal: controller.signal
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
      const controller = new AbortController();
      setAbortController(controller);
      
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt
        }),
        signal: controller.signal
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

  const stopResponse = () => {
    if (abortController) {
      abortController.abort();
      
      // If we have a partial response, save it
      if (streamingResponse) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: streamingResponse,
            timestamp: new Date().toISOString(),
            model: currentModel.name,
            stopped: true
          }
        ]);
      }
      
      setStreamingResponse('');
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const clearHistory = () => {
    // Clear messages from state
    setMessages([]);
    
    // Clear any streaming response
    setStreamingResponse('');
    
    // Clear from localStorage
    localStorage.removeItem(`chat_history_${selectedModel}`);
    
    // Reset any loading or streaming states
    setIsLoading(false);
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const saveConversation = () => {
    setIsSaving(true);
    
    try {
      // Create a formatted conversation text
      const conversationText = messages.map(msg => {
        const role = msg.role === 'user' ? 'User' : `${msg.model || 'Assistant'}`;
        return `${role}: ${msg.content}`;
      }).join('\n\n');
      
      // Create a blob and download link
      const blob = new Blob([conversationText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${selectedModel}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsSaving(false);
      }, 100);
    } catch (error) {
      console.error('Error saving conversation:', error);
      setIsSaving(false);
    }
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
                    {message.stopped && (
                      <span className="stopped-badge">Stopped</span>
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
            
            <div className="chat-actions">
              {messages.length > 1 && (
                <>
                  <motion.div
                    className="action-button streaming-toggle-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    title="When enabled, responses appear word by word in real-time. When disabled, responses appear all at once after completion."
                  >
                    <label className="streaming-toggle">
                      <input
                        type="checkbox"
                        checked={useStreaming}
                        onChange={() => setUseStreaming(!useStreaming)}
                      />
                      <span className="toggle-label">Streaming</span>
                    </label>
                  </motion.div>
                  
                  <motion.button 
                    className="action-button save-button"
                    onClick={saveConversation}
                    disabled={isSaving}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Save this conversation as a text file"
                  >
                    {isSaving ? 'Saving...' : 'Save Conversation'}
                  </motion.button>
                  
                  <motion.button 
                    className="action-button clear-button"
                    onClick={clearHistory}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Clear the current conversation history"
                  >
                    Clear History
                  </motion.button>
                </>
              )}
            </div>
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
            <span className={`character-count ${input.length >= characterLimit ? 'limit-reached' : ''}`}>
              {input.length}/{characterLimit}
            </span>
          </div>
          
          {isLoading && streamingResponse ? (
            <button
              type="button"
              className="stop-button"
              onClick={stopResponse}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" fill="currentColor" />
              </svg>
            </button>
          ) : (
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
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
