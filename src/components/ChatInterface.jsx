import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import './ChatInterface.css';
import PromptGuide from './PromptGuide';

const ChatInterface = ({ selectedModel, models }) => {
  const [messages, setMessages] = useState([]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [abortController, setAbortController] = useState(null);
  const [isStopped, setIsStopped] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const isAutoScrollingRef = useRef(true);
  const observerRef = useRef(null);
  const MAX_VISIBLE_MESSAGES = 50;
  const HISTORY_THRESHOLD = 100;
  const CHARACTER_LIMIT = 1500;

  // Get the current model from the models array
  const currentModel = models.find(model => model.id === selectedModel) || {};
  const characterLimit = currentModel?.characterLimit || 1500;

  // Get theme from document
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  // Load chat history from localStorage
  useEffect(() => {
    loadChatHistory();
  }, [selectedModel]);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages, selectedModel]);

  // Listen for example prompt application from PromptGuide
  useEffect(() => {
    const handleExamplePrompt = (event) => {
      setInput(event.detail.prompt);
    };
    
    document.addEventListener('applyExamplePrompt', handleExamplePrompt);
    
    return () => {
      document.removeEventListener('applyExamplePrompt', handleExamplePrompt);
    };
  }, []);

  // Handle message virtualization for performance
  useEffect(() => {
    if (messages.length > HISTORY_THRESHOLD) {
      // Only show the most recent MAX_VISIBLE_MESSAGES
      setVisibleMessages([
        { 
          role: 'system', 
          content: `Showing the most recent ${MAX_VISIBLE_MESSAGES} messages. ${messages.length - MAX_VISIBLE_MESSAGES} older messages are hidden.` 
        },
        ...messages.slice(messages.length - MAX_VISIBLE_MESSAGES)
      ]);
    } else {
      setVisibleMessages(messages);
    }
  }, [messages]);

  // Setup intersection observer for auto-scrolling
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    if (messagesEndRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          isAutoScrollingRef.current = entry.isIntersecting;
          
          // Show/hide scroll button based on whether we're at the bottom
          setShowScrollButton(!entry.isIntersecting && messages.length > 1);
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
  }, [visibleMessages]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      scrollPositionRef.current = scrollTop;
      
      // Check if user has scrolled to bottom
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      isAutoScrollingRef.current = isAtBottom;
      
      // Show scroll button if not at bottom and have messages
      setShowScrollButton(!isAtBottom && messages.length > 1);
    }
  }, [messages.length]);

  // Add scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior, 
        block: 'end' 
      });
      // After scrolling to bottom, update the auto-scrolling state
      isAutoScrollingRef.current = true;
      setShowScrollButton(false);
    }
  }, []);

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (isAutoScrollingRef.current) {
      scrollToBottom();
    }
  }, [visibleMessages, scrollToBottom]);

  // Load chat history from localStorage
  const loadChatHistory = useCallback(() => {
    try {
      const savedMessages = localStorage.getItem(`chatHistory-${selectedModel}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        
        // Scroll to bottom after loading history with a slight delay
        setTimeout(() => {
          scrollToBottom('auto');
        }, 100);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // If there's an error, clear the localStorage
      localStorage.removeItem(`chatHistory-${selectedModel}`);
    }
  }, [selectedModel, scrollToBottom]);

  // Save chat history to localStorage
  const saveChatHistory = useCallback(() => {
    try {
      localStorage.setItem(`chatHistory-${selectedModel}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages, selectedModel]);

  // Clear chat history
  const clearHistory = useCallback(() => {
    setMessages([]);
    setVisibleMessages([]);
    localStorage.removeItem(`chatHistory-${selectedModel}`);
  }, [selectedModel]);

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
    setCharacterCount(e.target.value.length);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isStreaming) return;
    
    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setCharacterCount(0);
    setIsError(false);
    setErrorMessage('');
    setIsStopped(false);
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      setIsStreaming(true);
      
      // Add a placeholder for the assistant's response
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'assistant', content: '', model: currentModel.name || selectedModel }
      ]);
      
      // Scroll to bottom to show the loading message
      setTimeout(() => scrollToBottom(), 50);
      
      // Make API request
      const response = await axios.post('http://localhost:3001/api/chat/stream', {
        modelId: selectedModel,
        model: selectedModel, // For backward compatibility
        prompt: input,
        message: input, // For backward compatibility
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        systemPrompt: currentModel.systemPrompt
      }, {
        signal: controller.signal,
        onDownloadProgress: progressEvent => {
          const dataChunk = progressEvent.event.target.responseText;
          try {
            // Update the assistant's response with the streamed content
            setMessages(prevMessages => {
              const updatedMessages = [...prevMessages];
              const lastMessage = updatedMessages[updatedMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = dataChunk;
                lastMessage.model = currentModel.name || selectedModel;
              }
              return updatedMessages;
            });
            
            // Auto-scroll if we were at the bottom
            if (isAutoScrollingRef.current) {
              scrollToBottom();
            }
          } catch (error) {
            console.error('Error processing stream chunk:', error);
          }
        }
      });
      
      // Final update with complete response
      if (response.status === 200 && !isStopped) {
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = response.data;
            lastMessage.model = currentModel.name || selectedModel;
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      // Don't show error if request was aborted intentionally
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        setIsStopped(true);
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.stopped = true;
          }
          return updatedMessages;
        });
        return;
      }
      
      // Handle other errors
      console.error('Error in chat request:', error);
      setIsError(true);
      
      let errorMsg = 'An error occurred. Please try again or switch to a different model.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.error || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      // Update the last message to show the error
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = errorMsg;
          lastMessage.error = true;
        }
        return updatedMessages;
      });
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  // Handle stopping the response
  const handleStopResponse = () => {
    if (abortController) {
      abortController.abort();
      setIsStopped(true);
    }
  };

  // Export chat history as a text file
  const exportChatHistory = () => {
    try {
      let chatText = '';
      messages.forEach(message => {
        const role = message.role.charAt(0).toUpperCase() + message.role.slice(1);
        chatText += `${role}: ${message.content}\n\n`;
      });
      
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${selectedModel}-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting chat history:', error);
    }
  };

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
          visibleMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`message ${message.role}-message ${message.error ? 'error-message' : ''}`}
            >
              <div className="message-header">
                <div className="message-role">
                  {message.role === 'user' ? 'You' : 
                   message.role === 'assistant' ? 'Assistant' : 'System'}
                  
                  {message.role === 'assistant' && message.model && (
                    <span className="model-badge">{message.model}</span>
                  )}
                  
                  {message.role === 'system' && (
                    <span className="system-badge">System</span>
                  )}
                  
                  {message.error && (
                    <span className="error-badge">Error</span>
                  )}
                  
                  {message.stopped && (
                    <span className="stopped-badge">Stopped</span>
                  )}
                </div>
              </div>
              
              <div className={`message-content ${message.error ? 'error-message' : ''}`}>
                {message.role === 'assistant' && isStreaming && index === visibleMessages.length - 1 ? (
                  <>
                    <ReactMarkdown>{message.content || 'Thinking...'}</ReactMarkdown>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div 
          className={`scroll-to-bottom ${showScrollButton ? 'visible' : ''}`}
          onClick={() => scrollToBottom()}
        >
          ↓
        </div>
      )}
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <textarea
            className="chat-textarea"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            style={{ height: 'auto', minHeight: '24px', maxHeight: '150px' }}
          />
          
          {isStreaming ? (
            <button 
              type="button" 
              className="send-button" 
              onClick={handleStopResponse}
              style={{ backgroundColor: '#f59e0b' }}
            >
              Stop
            </button>
          ) : (
            <button 
              type="submit" 
              className="send-button" 
              disabled={!input.trim() || characterCount > characterLimit}
            >
              Send
            </button>
          )}
        </form>
        
        <div className="chat-options">
          <span className={`character-count ${characterCount > characterLimit ? 'limit-exceeded' : ''}`}>
            {characterCount}/{characterLimit}
          </span>
          
          <PromptGuide selectedModel={selectedModel} />
          
          <div className="action-buttons">
            <button 
              className="action-button" 
              onClick={exportChatHistory}
              disabled={messages.length === 0}
            >
              Save Conversation
            </button>
            
            <button 
              className="action-button clear-button" 
              onClick={clearHistory}
              disabled={messages.length === 0}
            >
              Clear History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
