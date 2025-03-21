import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ModelSelector.css';

const ModelSelector = ({ models, selectedModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleModelSelect = (modelId) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  // Get the currently selected model
  const currentModel = models.find(model => model.id === selectedModel);

  // Get capability badge colors
  const getCapabilityColor = (capability) => {
    switch (capability) {
      case 'code':
        return '#3b82f6'; // blue
      case 'math':
        return '#f59e0b'; // amber
      case 'reasoning':
        return '#10b981'; // emerald
      case 'general':
        return '#8b5cf6'; // violet
      case 'instruction':
        return '#ec4899'; // pink
      case 'formal-logic':
        return '#ef4444'; // red
      case 'programming':
        return '#6366f1'; // indigo
      case 'creative':
        return '#ec4899'; // pink
      case 'problem-solving':
        return '#f97316'; // orange
      case 'efficiency':
        return '#14b8a6'; // teal
      case 'documentation':
        return '#8b5cf6'; // violet
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="model-selector" ref={dropdownRef}>
      <button 
        className="model-selector-button" 
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {currentModel ? (
          <div className="selected-model">
            <span className="model-name">{currentModel.name}</span>
            <div className="model-capabilities">
              {currentModel.capabilities && currentModel.capabilities.slice(0, 2).map((capability, index) => (
                <span 
                  key={index} 
                  className="capability-badge"
                  style={{ backgroundColor: getCapabilityColor(capability) }}
                >
                  {capability}
                </span>
              ))}
              {currentModel.capabilities && currentModel.capabilities.length > 2 && (
                <span className="capability-badge more-badge">
                  +{currentModel.capabilities.length - 2}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span>Select a model</span>
        )}
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="model-dropdown"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {models.map(model => (
              <motion.div
                key={model.id}
                className={`model-option ${model.id === selectedModel ? 'selected' : ''}`}
                onClick={() => handleModelSelect(model.id)}
                whileHover={{ backgroundColor: 'var(--hover-color)' }}
                role="option"
                aria-selected={model.id === selectedModel}
              >
                <div className="model-option-content">
                  <div className="model-option-header">
                    <span className="model-option-name">{model.name}</span>
                    <span className={`gpu-badge ${model.requiresGPU ? 'gpu-required' : 'cpu-only'}`}>
                      {model.requiresGPU ? 'GPU' : 'CPU'}
                    </span>
                  </div>
                  <p className="model-option-description">{model.description}</p>
                  <div className="model-option-capabilities">
                    {model.capabilities && model.capabilities.map((capability, index) => (
                      <span 
                        key={index} 
                        className="capability-badge"
                        style={{ backgroundColor: getCapabilityColor(capability) }}
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;
