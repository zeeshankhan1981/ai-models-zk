import { motion } from 'framer-motion';
import './ModelInfo.css';

const ModelInfo = ({ model }) => {
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
      className="model-info"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="model-info-header">
        <h2 className="model-info-name">{model.name}</h2>
      </div>
      
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
  );
};

export default ModelInfo;
