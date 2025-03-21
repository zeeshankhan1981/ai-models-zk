# LocalMind - Multi-Model AI Chat Interface

LocalMind is a modern, elegant, and feature-rich interface for interacting with multiple Ollama models on your local machine. It provides a seamless way to chat with different AI models, compare their responses, and leverage their unique capabilities - all while keeping your data private and secure on your own hardware.

![LocalMind Screenshot](screenshot.png)

## Features

### Model Support
- **Multiple Model Selection**: Choose from a variety of models including Mistral, DeepSeek, StarCoder2, Zephyr, Phi-2, WizardMath, and MetaMath
- **GPU/CPU Indicators**: Clear labeling of which models require GPU acceleration and which can run efficiently on CPU
- **Model Information Panel**: Detailed information about each model including capabilities, temperature settings, and character limits

### Chat Experience
- **Real-time Streaming Responses**: See model responses as they're generated character by character
- **Stop Generation Mid-Response**: Interrupt model responses at any point if you have the information you need
- **Syntax Highlighting**: Beautiful code highlighting for programming responses
- **Markdown Support**: Rich text formatting with full markdown rendering
- **Character Counter**: Visual indicator of input length with configurable limits per model

### User Interface
- **Light/Dark Mode**: Toggle between themes based on your preference
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Animated Transitions**: Smooth animations for a polished user experience
- **Loading Indicators**: Clear visual feedback during model processing

### History & Management
- **Persistent Chat History**: Conversations are automatically saved locally for each model
- **Export Conversations**: Save your chats as text files for reference or sharing
- **Clear History**: Option to reset conversations when needed
- **Model Identification**: Each response is clearly labeled with the model that generated it

### Technical Features
- **Response Cleaning**: Automatic removal of formatting tokens and artifacts from model outputs
- **Custom System Prompts**: Tailored system instructions for each model to optimize responses
- **Error Handling**: Robust error management with user-friendly messages
- **Local Processing**: All data stays on your machine for complete privacy

## Architecture

LocalMind consists of two main components:

1. **Frontend**: A React application built with Vite that provides the user interface
2. **Backend**: An Express.js API server that communicates with Ollama

The application uses a RESTful API architecture with endpoints for:
- Fetching available models
- Sending chat messages
- Streaming responses in real-time

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Ollama](https://ollama.ai/) installed on your machine

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zeeshankhan1981/ai-models-zk.git
   cd ai-models-zk
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. Make sure Ollama is running and the required models are pulled:
   ```bash
   ollama pull mistral
   ollama pull deepseek
   ollama pull starcoder2
   ollama pull zephyr
   ollama pull phi2
   ollama pull wizardmath
   ollama pull metamath
   ```

4. Start the backend API server:
   ```bash
   cd server
   npm start
   ```

5. In a new terminal, start the frontend:
   ```bash
   cd /path/to/ai-models-zk
   npm run dev
   ```

6. Open your browser and navigate to http://localhost:5173 or the URL shown in your terminal

## Model Details

| Model | Description | Capabilities | Requires GPU | Character Limit | Temperature |
|-------|-------------|--------------|--------------|-----------------|-------------|
| Mistral | Balanced model with good instruction following | General, Reasoning, Instruction | Yes | 1000 | 0.7 |
| DeepSeek | Specialized for code generation | Code, Reasoning, Math | Yes | 1000 | 0.5 |
| StarCoder2 | Advanced code generation | Code, Programming, Documentation | Yes | 1000 | 0.7 |
| Zephyr | Balanced with creative capabilities | General, Reasoning, Creative | No | 1000 | 0.7 |
| Phi-2 | Small but powerful general model | General, Instruction, Efficiency | No | 1000 | 0.7 |
| WizardMath | Specialized for math problems | Math, Reasoning, Problem-solving | Yes | 1000 | 0.7 |
| MetaMath | Advanced mathematical reasoning | Math, Reasoning, Formal-logic | Yes | 1000 | 0.7 |
| MythoMax-L2 | Creative storytelling and imagination | Creative, Storytelling, Reasoning | Yes | 1000 | 0.7 |

## GPU Acceleration

Models that require GPU acceleration are clearly labeled in the interface. On Apple Silicon Macs, Metal acceleration is used automatically for compatible models, providing significantly faster inference.

For optimal performance:
- Ensure your system has adequate GPU memory for the models you're using
- Monitor GPU usage with Activity Monitor (Mac) or Task Manager (Windows)
- Consider closing other GPU-intensive applications when using multiple large models

## Project Structure

```
ai-models-zk/
├── public/                  # Static assets
├── server/                  # Backend API server
│   ├── api.js               # API endpoints and model definitions
│   └── package.json         # Backend dependencies
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── ChatInterface.jsx    # Main chat interface
│   │   ├── ModelSelector.jsx    # Model selection dropdown
│   │   ├── ModelInfo.jsx        # Model information display
│   │   └── ThemeToggle.jsx      # Light/dark mode toggle
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── styles/              # CSS and styling
└── package.json             # Frontend dependencies
```

## Customization

### Adding New Models

To add a new model:

1. Pull the model using Ollama:
   ```bash
   ollama pull your-new-model
   ```

2. Add the model definition to `server/api.js`:
   ```javascript
   {
     id: 'model-id',
     name: 'Model Name',
     description: 'Model description',
     capabilities: ['capability1', 'capability2'],
     characterLimit: 1000,
     temperature: 0.7,
     requiresGPU: true/false,
     systemPrompt: "Custom system prompt for this model"
   }
   ```

### Modifying System Prompts

Each model has a custom system prompt that guides its behavior. These can be modified in `server/api.js` to better suit your specific needs.

### Styling

The application uses CSS variables for theming, making it easy to customize the look and feel. The main theme variables are defined in `src/App.css`.

## Troubleshooting

- **Models not loading**: Ensure Ollama is running (`ollama serve`) and the models have been pulled
- **Slow responses**: For GPU-intensive models, check your system resources and close other demanding applications
- **Connection errors**: Verify that the API server is running on port 3001 and accessible to the frontend
- **Formatting issues**: If model responses contain unexpected formatting tokens, you may need to update the cleaning patterns in `cleanModelResponse` function

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgements

- [Ollama](https://ollama.ai/) for the local LLM runtime
- [React](https://reactjs.org/) for the UI framework
- [Express](https://expressjs.com/) for the backend API
- [Framer Motion](https://www.framer.com/motion/) for animations
- [React Markdown](https://github.com/remarkjs/react-markdown) for markdown rendering
- [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) for code highlighting
