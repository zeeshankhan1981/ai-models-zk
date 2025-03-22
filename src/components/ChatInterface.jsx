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
  const [modelAvailability, setModelAvailability] = useState({});
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

  // Check model availability when component mounts
  useEffect(() => {
    checkModelAvailability();
  }, []);

  // Check model availability when selected model changes
  useEffect(() => {
    if (selectedModel) {
      // Clear streaming response when model changes
      setStreamingResponse('');
      
      // Cancel any ongoing requests
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      
      // Reset loading state
      setIsLoading(false);
      
      // Check if the new model is available
      checkModelAvailability();
      
      // Clear chat when switching models
      clearChatOnModelSwitch();
    }
  }, [selectedModel]);

  // Reset streaming state when model changes
  useEffect(() => {
    // If we're in the middle of a streaming response, abort it
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // Reset streaming response
    setStreamingResponse('');
    setIsLoading(false);
    
    // Load chat history for this model from localStorage
    loadChatHistory();
  }, [selectedModel]);

  // Add a function to clear chat when switching models
  const clearChatOnModelSwitch = () => {
    setMessages([
      {
        role: 'assistant',
        content: `You are now chatting with ${currentModel.name}. ${currentModel.shortDescription || ''}`,
        timestamp: new Date().toISOString(),
        model: currentModel.name || selectedModel,
        isSystemMessage: true
      }
    ]);
    setStreamingResponse('');
    localStorage.removeItem(`chatHistory-${selectedModel}`);
  };

  // Check which models are available in Ollama
  const checkModelAvailability = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/models/check');
      if (!response.ok) {
        console.error('Failed to check model availability');
        return;
      }
      
      const data = await response.json();
      
      if (data.models) {
        const availability = {};
        data.models.forEach(model => {
          availability[model.id] = model.available;
        });
        
        setModelAvailability(availability);
        console.log('Model availability:', availability);
      }
    } catch (error) {
      console.error('Error checking model availability:', error);
    }
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const savedMessages = localStorage.getItem(`chatHistory-${selectedModel}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      setMessages([]);
    }
  };

  // Effect to save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages, selectedModel]);

  // Function to clean model responses of formatting tokens
  const cleanModelResponse = (response) => {
    if (!response) return '';
    
    let cleaned = response;
    
    // Remove common formatting tokens
    const formatTokens = [
      /\[INST\].*?\[\/INST\]/gs,  // Instruction tokens
      /<<SYS>>.*?<<\/SYS>>/gs,    // System tokens
      /<s>|<\/s>/g,               // Start/end tokens
      /<\|.*?\|>/g,               // Special tokens
      /\[system\].*?\[\/system\]/gs, // System message tokens
      /\[user\]|\[\/user\]/g,     // User tokens
      /\[assistant\]|\[\/assistant\]/g, // Assistant tokens
    ];
    
    formatTokens.forEach(token => {
      cleaned = cleaned.replace(token, '');
    });
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    // If cleaning resulted in an empty string, return the original
    if (!cleaned) {
      console.warn('Cleaning resulted in empty string, using original response');
      return response.trim();
    }
    
    return cleaned;
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
    if (e) e.preventDefault();
    
    if (input.trim() === '' || isLoading) return;
    
    // Check if model is available
    if (!modelAvailability[selectedModel]) {
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: input,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: `Error: The model "${currentModel.name}" is not available in Ollama. Please make sure it's installed or select a different model.`,
          timestamp: new Date().toISOString(),
          model: currentModel.name || selectedModel,
          error: true
        }
      ]);
      setInput('');
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
      }
    ]);
    
    const userPrompt = input;
    setInput('');
    
    try {
      if (useStreaming) {
        setIsLoading(true);
        
        // Start streaming response
        await streamResponse(userPrompt);
      } else {
        setIsLoading(true);
        
        // Get complete response
        const response = await getResponse(userPrompt);
        
        // Add assistant message to chat
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            model: currentModel.name || selectedModel
          }
        ]);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error.message || error);
      
      // Error is already handled in getResponse or streamResponse
    } finally {
      setIsLoading(false);
      setAbortController(null);
      
      // Save chat history
      saveChatHistory();
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
          modelId: selectedModel,
          prompt: prompt,
          systemPrompt: currentModel.systemPrompt
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error('Error getting error text:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.response || data.response.trim() === '') {
        console.error('Empty response from API');
        throw new Error('Received empty response from the model');
      }
      
      // Clean the response before displaying
      const cleanedResponse = cleanModelResponse(data.response);
      
      // Add assistant message to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: cleanedResponse,
          timestamp: new Date().toISOString(),
          model: currentModel.name || selectedModel
        }
      ]);
      
      // Save chat history
      saveChatHistory();
      
      return cleanedResponse;
    } catch (error) {
      if (error.name === 'AbortError') {
        // This is an expected abort, not an error
        return;
      }
      console.error('Error in getResponse:', error.message || error);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message || 'An unexpected error occurred'}. Please try again.`,
          timestamp: new Date().toISOString(),
          model: currentModel.name || selectedModel,
          error: true
        }
      ]);
      
      throw error;
    }
  };

  const streamResponse = async (prompt) => {
    try {
      const controller = new AbortController();
      setAbortController(controller);
      
      setStreamingResponse('');
      
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: selectedModel,
          prompt: prompt,
          systemPrompt: currentModel.systemPrompt
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error('Error getting error text:', textError);
          }
        }
        throw new Error(errorMessage);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let accumulatedResponse = '';
      
      while (!done) {
        try {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          accumulatedResponse += chunk;
          
          // Clean the response before displaying
          const cleanedResponse = cleanModelResponse(accumulatedResponse);
          setStreamingResponse(cleanedResponse);
        } catch (readError) {
          // Check if this is an abort error (user cancelled or navigated away)
          if (readError.name === 'AbortError') {
            console.log('Stream reading was aborted by user');
            return; // Exit gracefully
          }
          
          // For other errors, log but don't throw to allow the stream to continue if possible
          console.error('Error reading stream chunk:', readError.message || readError);
          
          // Only throw fatal errors that would prevent continuing
          if (readError.message !== 'The operation was aborted.' && 
              readError.message !== 'The user aborted a request.') {
            throw readError;
          }
        }
      }
      
      // Only add the complete response to messages if we haven't aborted
      if (!controller.signal.aborted) {
        const finalResponse = cleanModelResponse(accumulatedResponse);
        
        if (!finalResponse || finalResponse.trim() === '') {
          console.error('Empty response after cleaning');
          throw new Error('Received empty response from the model');
        }
        
        // Add assistant message to chat
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: finalResponse,
            timestamp: new Date().toISOString(),
            model: currentModel.name || selectedModel
          }
        ]);
        
        // Reset streaming response
        setStreamingResponse('');
        
        // Save chat history
        saveChatHistory();
      }
    } catch (error) {
      // Check if this is an abort error (user cancelled or navigated away)
      if (error.name === 'AbortError' || 
          error.message === 'The operation was aborted.' || 
          error.message === 'The user aborted a request.') {
        console.log('Stream request was aborted by user');
        return; // Exit gracefully
      }
      
      console.error('Error in streamResponse:', error.message || error);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message || 'An unexpected error occurred'}. Please try again.`,
          timestamp: new Date().toISOString(),
          model: currentModel.name || selectedModel,
          error: true
        }
      ]);
      
      // Reset streaming response
      setStreamingResponse('');
      
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
            model: currentModel.name || selectedModel,
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
    setMessages([]);
    localStorage.removeItem(`chatHistory-${selectedModel}`);
    console.log(`Cleared chat history for model: ${selectedModel}`);
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

  const saveChatHistory = () => {
    try {
      localStorage.setItem(`chatHistory-${selectedModel}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
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
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'} ${message.error ? 'error-message' : ''} ${message.isSystemMessage ? 'system-message' : ''}`}
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
                    {message.role === 'assistant' && message.error && (
                      <span className="error-badge">Error</span>
                    )}
                    {message.role === 'assistant' && message.isSystemMessage && (
                      <span className="system-badge">System</span>
                    )}
                  </span>
                </div>
                <div className={`message-content ${message.error ? 'error-message' : ''}`}>
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
            
            {/* Only show streaming response if there's content and we're not loading a full response */}
            {streamingResponse && isLoading && useStreaming && (
              <motion.div 
                className="message assistant-message streaming"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-header">
                  <span className="message-role">
                    Assistant
                    {currentModel.name && (
                      <span className="model-badge">{currentModel.name}</span>
                    )}
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
            disabled={isLoading || !modelAvailability[selectedModel]}
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
            <span className={`character-count ${input.length > characterLimit ? 'limit-exceeded' : ''}`}>
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
              disabled={isLoading || input.trim() === '' || input.length > characterLimit || !modelAvailability[selectedModel]}
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
