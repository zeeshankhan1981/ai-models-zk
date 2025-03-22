import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const observerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  // Get the current model from the models array
  const currentModel = models.find(model => model.id === selectedModel) || {};
  const characterLimit = currentModel?.characterLimit || 1500;
  
  // Get theme from document
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  // Improved scroll handling with IntersectionObserver
  useEffect(() => {
    // Create a new IntersectionObserver for the end element
    if (messagesEndRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(messagesEndRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Handle saving scroll position when scrolling
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      scrollPositionRef.current = chatContainerRef.current.scrollTop;
    }
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => {
        chatContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Auto-scroll to bottom when new messages are added or when streaming
  useEffect(() => {
    if (isAtBottom || isLoading) {
      scrollToBottom();
    }
  }, [messages, streamingResponse, isAtBottom, isLoading, scrollToBottom]);

  // Handle textarea auto-resize
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

  // Handle model switching
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

  // Load chat history when model changes
  useEffect(() => {
    loadChatHistory();
  }, [selectedModel]);

  // Add a function to clear chat when switching models
  const clearChatOnModelSwitch = () => {
    setMessages([
      {
        role: 'assistant',
        content: `You are now chatting with ${currentModel.name || selectedModel}. ${currentModel.shortDescription || ''}`,
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
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        
        // Set a small timeout to ensure the DOM has updated before scrolling
        setTimeout(() => {
          scrollToBottom();
        }, 100);
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
          content: `Error: The model "${currentModel.name || selectedModel}" is not available in Ollama. Please make sure it's installed or select a different model.`,
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
        await getResponse(userPrompt);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error.message || error);
      
      // Error is already handled in getResponse or streamResponse
    } finally {
      setIsLoading(false);
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

  const handleStop = () => {
    stopResponse();
  };

  // Virtualization for better performance with large chat histories
  useEffect(() => {
    if (messages.length > 100) {
      // Only show the last 50 messages for very large histories
      setVisibleMessages(messages.slice(-50));
    } else {
      setVisibleMessages(messages);
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <div 
        className="chat-messages" 
        ref={chatContainerRef}
      >
        {visibleMessages.length === 0 ? (
          <div className="empty-chat">
            <h3>Start a conversation</h3>
            <p>Send a message to begin chatting with {currentModel.name || selectedModel}</p>
          </div>
        ) : (
          <>
            {messages.length > 100 && (
              <div className="message-history-notice">
                Showing most recent messages. {messages.length - 50} older messages are hidden.
              </div>
            )}
            
            {visibleMessages.map((message, index) => (
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
                    {message.role === 'assistant' && message.stopped && (
                      <span className="stopped-badge">Stopped</span>
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
            
            {/* Show streaming response */}
            {streamingResponse && (
              <motion.div 
                className="message assistant-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="message-header">
                  <span className="message-role">
                    Assistant
                    <span className="model-badge">{currentModel.name || selectedModel}</span>
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
            <div ref={messagesEndRef} style={{ height: '10px', width: '100%' }} />
          </>
        )}
      </div>
      
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentModel.name || selectedModel}...`}
            disabled={isLoading || !modelAvailability[selectedModel]}
          />
          
          {isLoading ? (
            <button 
              className="send-button" 
              onClick={handleStop}
              title="Stop generating"
            >
              Stop
            </button>
          ) : (
            <button 
              className="send-button" 
              onClick={handleSubmit}
              disabled={input.trim() === '' || input.length > characterLimit || !modelAvailability[selectedModel]}
              title="Send message"
            >
              Send
            </button>
          )}
        </div>
        
        <div className="chat-options">
          <span className={`character-count ${input.length > characterLimit ? 'limit-exceeded' : ''}`}>
            {input.length}/{characterLimit}
          </span>
          
          <div className="action-buttons">
            <button 
              className="action-button toggle-button"
              onClick={() => setUseStreaming(!useStreaming)}
              title={useStreaming ? "Turn off streaming" : "Turn on streaming"}
            >
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={useStreaming}
                  onChange={() => setUseStreaming(!useStreaming)}
                />
                <span className="toggle-slider"></span>
              </label>
              Streaming
            </button>
            
            <button 
              className="action-button"
              onClick={saveConversation}
              disabled={messages.length === 0 || isSaving}
              title="Save conversation"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            <button 
              className="action-button clear-button"
              onClick={clearHistory}
              disabled={messages.length === 0}
              title="Clear conversation"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
