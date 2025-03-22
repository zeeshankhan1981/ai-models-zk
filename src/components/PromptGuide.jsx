import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './PromptGuide.css';

const PromptGuide = ({ modelId, visible }) => {
  const [guideContent, setGuideContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Map model IDs to their corresponding markdown file names
  const getGuideFileName = (id) => {
    const modelGuideMap = {
      'mistral:latest': 'mistral.md',
      'mistral:instruct': 'mistral.md',
      'deepseek:latest': 'deepseek.md',
      'starcoder:latest': 'starcoder.md',
      'starcoder2:latest': 'starcoder2.md',
      'zephyr-7b:latest': 'zephyr-7b.md',
      'phi-2:latest': 'phi-2.md',
      'metamath:latest': 'metamath.md',
      'llama2:latest': 'llama2.md',
      'llama2:chat': 'llama2.md',
      'llama3:latest': 'llama3.md',
      'gemma:2b': 'gemma-2b.md'
    };
    
    // Try to match the base model name if exact match not found
    if (modelGuideMap[id]) {
      return modelGuideMap[id];
    }
    
    // Try to match by prefix (e.g., "llama2:something" should use llama2.md)
    const baseModelId = id.split(':')[0];
    for (const key in modelGuideMap) {
      if (key.startsWith(baseModelId)) {
        return modelGuideMap[key];
      }
    }
    
    // Fallback to using the model ID directly
    return `${id.replace(':', '-')}.md`;
  };

  // Extract example prompt from markdown content
  const extractExamplePrompt = (content) => {
    const exampleSection = content.split('## Example Prompt:')[1];
    return exampleSection ? exampleSection.trim() : '';
  };

  // Copy example prompt to clipboard
  const copyExamplePrompt = () => {
    const examplePrompt = extractExamplePrompt(guideContent);
    if (examplePrompt) {
      navigator.clipboard.writeText(examplePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Toggle guide visibility
  const toggleGuide = () => {
    setIsOpen(!isOpen);
  };

  // Load guide content when model changes
  useEffect(() => {
    if (!modelId) return;
    
    const fileName = getGuideFileName(modelId);
    console.log(`Loading prompt guide: /prompt_guides/${fileName}`);
    
    fetch(`/prompt_guides/${fileName}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Guide not found for ${modelId}`);
        }
        return response.text();
      })
      .then(content => {
        setGuideContent(content);
      })
      .catch(error => {
        console.error('Error loading prompt guide:', error);
        setGuideContent(`# ${modelId} Prompting Guide\n\nNo specific guide available for this model yet.`);
      });
  }, [modelId]);

  return (
    <div className={`prompt-guide-container ${visible ? 'visible' : ''}`}>
      <div className="prompt-guide-header">
        <h3 className="prompt-guide-title">Prompt Guide</h3>
        <button 
          className={`prompt-guide-toggle ${isOpen ? 'open' : ''}`} 
          onClick={toggleGuide}
          aria-label="Toggle prompt guide"
        >
          {isOpen ? 'Hide' : 'Show'} Guide
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      
      {isOpen && (
        <div className="prompt-guide-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {guideContent}
          </ReactMarkdown>
          
          {extractExamplePrompt(guideContent) && (
            <button className="copy-button" onClick={copyExamplePrompt}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              {copied ? 'Copied!' : 'Copy Example'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptGuide;
