import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './PromptGuide.css';

const PromptGuide = ({ selectedModel }) => {
  const [guideContent, setGuideContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Map model IDs to their corresponding guide files
  // This mapping must exactly match the model IDs in server/api.js
  const modelGuideMap = {
    'mistral': 'mistral_latest.md',
    'deepseek': 'deepseek_latest.md',
    'starcoder2': 'starcoder2_latest.md',
    'starcoder': 'starcoder_latest.md',
    'zephyr-7b': 'zephyr_7b_latest.md',
    'metamath': 'metamath_latest.md',
    'phi-2': 'phi_2_latest.md',
    'llama2': 'llama2_latest.md',
    'llama2:chat': 'llama2_chat.md',
    'llama3': 'llama3_latest.md',
    'gemma:2b': 'gemma_2b.md'
  };

  // Load the appropriate guide when the selected model changes
  useEffect(() => {
    loadGuide();
  }, [selectedModel]);

  const loadGuide = async () => {
    if (!selectedModel) return;
    
    const guideFile = modelGuideMap[selectedModel];
    
    if (!guideFile) {
      console.log(`No guide file found for model: ${selectedModel}`);
      setGuideContent('No specific guide available for this model.');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch(`/prompt_guides/${guideFile}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load guide: ${response.status}`);
      }
      
      const content = await response.text();
      setGuideContent(content);
    } catch (error) {
      console.error('Error loading prompt guide:', error);
      setGuideContent('Error loading guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle the guide panel
  const toggleGuide = () => {
    setIsOpen(!isOpen);
  };

  // Apply example prompt to chat input
  const applyExamplePrompt = (event) => {
    const promptText = event.target.innerText;
    
    // Create and dispatch a custom event
    const customEvent = new CustomEvent('applyExamplePrompt', { 
      detail: { prompt: promptText } 
    });
    
    document.dispatchEvent(customEvent);
    
    // Close the guide after applying
    setIsOpen(false);
  };

  return (
    <div className="prompt-guide-container">
      <button 
        className="guide-button" 
        onClick={toggleGuide}
        aria-expanded={isOpen}
      >
        Prompt Guide
      </button>
      
      {isOpen && (
        <div className="guide-panel">
          <div className="guide-header">
            <h3>Prompt Guide</h3>
            <button className="close-button" onClick={toggleGuide}>×</button>
          </div>
          
          <div className="guide-content">
            {isLoading ? (
              <div className="loading">Loading guide...</div>
            ) : (
              <ReactMarkdown 
                children={guideContent}
                components={{
                  // Make example prompts clickable
                  p: ({node, ...props}) => {
                    const content = node.children[0]?.value;
                    if (content && node.position.start.line > 10) { // Assuming examples are after line 10
                      return (
                        <p 
                          className="example-prompt" 
                          onClick={applyExamplePrompt}
                          {...props}
                        />
                      );
                    }
                    return <p {...props} />;
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptGuide;
