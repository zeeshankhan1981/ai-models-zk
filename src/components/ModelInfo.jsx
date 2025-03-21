import { motion } from 'framer-motion';
import { useState } from 'react';
import './ModelInfo.css';

const ModelInfo = ({ model }) => {
  const [expanded, setExpanded] = useState(false);
  
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
    <motion.div 
      className={`model-info ${expanded ? 'expanded' : 'collapsed'}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="model-info-header" onClick={() => setExpanded(!expanded)}>
        <div className="model-info-title">
          <h2 className="model-info-name">{model.name}</h2>
          <span className={`gpu-badge ${model.requiresGPU ? 'gpu-required' : 'cpu-only'}`}>
            {model.requiresGPU ? 'GPU' : 'CPU'}
          </span>
        </div>
        <button className={`expand-toggle ${expanded ? 'expanded' : ''}`} aria-label="Toggle model details">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      
      {expanded && (
        <motion.div
          className="model-info-details"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="model-info-description">{model.description}</p>
          
          <div className="model-info-capabilities">
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
          
          <div className="model-info-parameters">
            <div className="parameter">
              <span className="parameter-label">Temperature:</span>
              <span className="parameter-value">{model.temperature}</span>
            </div>
            <div className="parameter">
              <span className="parameter-label">Character Limit:</span>
              <span className="parameter-value">{model.characterLimit}</span>
            </div>
            <div className="parameter">
              <span className="parameter-label">API Endpoint:</span>
              <span className="parameter-value">localhost:11434</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ModelInfo;
