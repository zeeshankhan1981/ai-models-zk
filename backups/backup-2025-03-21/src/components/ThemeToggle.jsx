import { motion } from 'framer-motion';
import './ThemeToggle.css';

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="toggle-track">
        <motion.div 
          className="toggle-thumb"
          initial={false}
          animate={{ 
            x: theme === 'light' ? 0 : 22,
            backgroundColor: theme === 'light' ? '#f59e0b' : '#3b82f6'
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        <div className="toggle-icons">
          <span className="sun-icon" aria-hidden="true">☀️</span>
          <span className="moon-icon" aria-hidden="true">🌙</span>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
