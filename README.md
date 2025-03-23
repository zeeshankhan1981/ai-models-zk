# Averroes - Multi-Model AI Chat Interface

Averroes is a modern, elegant, and feature-rich interface for interacting with multiple Ollama models on your local machine. It provides a seamless way to chat with different AI models, compare their responses, and leverage their unique capabilities - all while keeping your data private and secure on your own hardware.

![Averroes Screenshot](screenshot.png)

## Features

### Model Support
- **Multiple Model Selection**: Choose from a variety of models including Mistral, DeepSeek, StarCoder2, Zephyr, Phi-2, WizardMath, and MetaMath
- **GPU/CPU Indicators**: Clear labeling of which models require GPU acceleration and which can run efficiently on CPU
- **Model Information Panel**: Detailed information about each model including capabilities, temperature settings, and character limits
- **Prompt Engineering Guides**: Each model comes with tailored prompting tips and example prompts to help you get the best results

### Chat Experience
- **Real-time Streaming Responses**: See model responses as they're generated character by character
- **Stop Generation Mid-Response**: Interrupt model responses at any point if you have the information you need
- **Model-Specific Prompt Guides**: Access tailored prompting tips and examples for each model to get better results
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

## System Architecture

### Frontend
- **Framework**: React 19.0.0 with Vite 6.2.0
- **UI Components**: Custom-built with Tailwind CSS
- **State Management**: React Context API
- **Features**:
  - Real-time streaming responses
  - Model-specific prompt guides
  - Persistent chat history
  - Light/Dark theme support
  - Responsive design

### Backend
- **Framework**: Express.js 4.18.2
- **Language**: Node.js (ES Modules)
- **API Endpoints**:
  - `/api/models`: List available models
  - `/api/models/available`: Check model availability
  - `/api/chat`: Process chat messages
  - `/api/stream`: Stream model responses
  - `/api/chain`: Model chaining endpoint

### Dependencies
- **Frontend**:
  - React 19.0.0
  - React DOM 19.0.0
  - React Router DOM 7.4.0
  - Axios 1.8.4
  - Framer Motion 12.5.0
  - React Markdown 10.1.0
  - React Syntax Highlighter 15.6.1

- **Backend**:
  - Express 4.18.2
  - Axios 1.6.0
  - CORS 2.8.5

### Development Tools
- **Build Tool**: Vite 6.2.0
- **Plugin**: @vitejs/plugin-react 4.3.4
- **ESLint**: 9.21.0
- **TypeScript**: @types/react 19.0.10
- **Node.js**: ES Modules (type: "module")

## Server Configuration

### Production Setup
- **Web Server**: Nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt
- **Domain**: averroes.xyz
- **Ports**:
  - Frontend: 5173
  - Backend: 3000
  - API: 3001
  - Ollama: 11434

### Environment Variables
```bash
# .env file
PORT=3000
API_PORT=3001
OLLAMA_URL=http://localhost:11434
NODE_ENV=production
```

### Model Configuration
- **Model Directory**: `modelfiles/`
- **Supported Models**:
  - Mistral:latest
  - DeepSeek:latest
  - StarCoder2:latest
  - Zephyr-7b:latest
  - Phi-2:latest
  - MetaMath:latest
  - Llama2:latest
  - Llama3:latest
  - Gemma:2b

### System Requirements
- **CPU**: Multi-core processor (Recommended: 8+ cores)
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 250GB SSD minimum
- **GPU**: Optional for enhanced performance
- **Network**: Stable internet connection for model downloads

### Security Features
- **Data Privacy**: All processing happens locally
- **Rate Limiting**: Built-in protection against abuse
- **Input Validation**: Comprehensive validation of user inputs
- **Error Handling**: Robust error management
- **Logging**: Secure logging system

## Architecture

Averroes consists of two main components:

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

| Model | Description | Capabilities | Requires GPU | Character Limit | Temperature | Top-p | Top-k |
|-------|-------------|--------------|--------------|-----------------|-------------|-------|-------|
| Mistral | Balanced model with good instruction following | General, Reasoning, Instruction | Yes | 1500 | 0.6 | 0.9 | 40 |
| DeepSeek | Specialized for code generation | Code, Reasoning, Math | Yes | 1500 | 0.4 | 0.95 | 40 |
| StarCoder2 | Advanced code generation | Code, Programming, Documentation | Yes | 1500 | 0.5 | 0.95 | 40 |
| Zephyr | Balanced with creative capabilities | General, Reasoning, Creative | No | 1500 | 0.7 | 0.9 | 40 |
| Phi-2 | Small but powerful general model | General, Instruction, Efficiency | No | 1500 | 0.7 | 0.9 | 40 |
| WizardMath | Specialized for math problems | Math, Reasoning, Problem-solving | Yes | 1500 | 0.5 | 0.95 | 40 |
| MetaMath | Advanced mathematical reasoning | Math, Reasoning, Formal-logic | Yes | 1500 | 0.5 | 0.95 | 40 |

## New in v2.9

### Enhanced Model Chain Experience

Version 2.9 introduces significant improvements to the AI Model Chaining feature, focusing on user experience and interface consistency:

- **Redesigned UI**: The model chain interface now matches the design and experience of the regular chat interface, providing a seamless transition between modes
- **Interactive Message Display**: Each model's output is displayed in the same animated, card-based format as the chat interface
- **Model Role Badges**: Clear visual indicators showing each model's specific role in the generation process
- **Article Management**:
  - **Save Article**: Export the complete article with all intermediate outputs as a text file
  - **Clear Article**: Reset the current generation to start fresh
  - **Automatic History**: Articles are automatically saved to local storage for future reference
- **Input Controls**:
  - **Character Counter**: Visual indicator showing topic length with configurable limits
  - **Responsive Textarea**: Auto-expanding input field for longer topic descriptions
- **Error Handling**:
  - **Detailed Error Messages**: Clear explanations when issues occur during generation
  - **Visual Error Indicators**: Distinct styling for error states
  - **Improved Recovery**: Better handling of connection and model availability issues

This update enhances the user experience by providing a more consistent interface across the application while adding powerful new features for managing generated content.

## New in v2.9.1

### Model Chain Experience

The Model Chain feature now includes an intuitive visual flow indicator that clearly illustrates the 4-model process:

- **Visual Process Indicator**: A dynamic flow diagram shows each model in the chain with its specific role
- **Real-time Status Tracking**: Visual indicators show which model is currently active during generation
- **Role-based Design**: Each model is presented with its specific function in the article creation process:
  - **Gemma 2B**: Generates initial ideas and angles for the article
  - **Mistral**: Creates logical structure and outline
  - **Zephyr 7B**: Transforms the outline into engaging prose
  - **LLaMA 3**: Expands and refines into the final polished article
- **Animated Transitions**: Smooth animations indicate progress through the chain
- **Responsive Design**: Adapts to different screen sizes for optimal viewing on any device

This enhancement makes the deterministic nature of the model chain transparent to users, providing insight into how each model contributes to the final output.

## New in v2.8

### AI Model Chaining for Longform Content

The latest version introduces a powerful model chaining feature that leverages multiple AI models in sequence to generate high-quality longform content:

- **Deterministic 4-Model Chain**: Uses a fixed sequence of models (gemma:2b → mistral:latest → zephyr-7b:latest → llama3:latest) to generate articles
- **Specialized Model Roles**:
  - **Gemma 2B**: Generates multiple topic angles
  - **Mistral**: Chooses one angle and structures it logically
  - **Zephyr**: Transforms the structure into emotionally engaging prose
  - **LLaMA 3**: Expands and polishes into a complete article

- **Simple Interface**: Enter a topic and get a fully developed article
- **Process Transparency**: View outputs from each stage of the generation process
- **Toggle Between Modes**: Easily switch between regular chat and model chain modes

This feature is designed to be deterministic and secure, with fixed system prompts and a predefined execution flow to ensure consistent, high-quality results.

## New in v2.7

### Model-Specific Prompt Guides
The latest version introduces model-specific prompt guides to help users craft more effective prompts for each AI model:

- **Best Use Cases**: Learn what tasks each model excels at
- **Prompting Tips**: Get tailored advice on how to structure prompts for each model
- **Example Prompts**: Copy and use example prompts that work well with specific models
- **One-Click Copy**: Easily copy example prompts to the chat input with a single click

The prompt guides are accessible directly in the chat interface and provide valuable insights into how to get the best results from each model. This feature helps users understand the unique capabilities and optimal prompting patterns for different AI models.

## GPU Acceleration

Models that require GPU acceleration are clearly labeled in the interface. On Apple Silicon Macs, Metal acceleration is used automatically for compatible models, providing significantly faster inference.

For optimal performance:
- Ensure your system has adequate GPU memory for the models you're using
- Monitor GPU usage with Activity Monitor (Mac) or Task Manager (Windows)
- Consider closing other GPU-intensive applications when using multiple large models

### Optimizing Model Performance

The models have been configured with optimized parameters to reduce hallucination and improve response quality:

1. **Temperature Settings**:
   - Lower temperature (0.4-0.5) for technical models (DeepSeek, StarCoder2, WizardMath, MetaMath)
   - Moderate temperature (0.6-0.7) for general-purpose models (Mistral, Zephyr, Phi-2)

2. **Sampling Parameters**:
   - Top-p (nucleus sampling): Controls diversity by considering tokens that make up the top p probability mass
   - Top-k: Limits selection to the k most likely next tokens
   - Technical models use higher top-p (0.95) for more precise responses
   - General models use moderate top-p (0.9) for balanced creativity and accuracy

3. **System Prompts**:
   - Enhanced to explicitly instruct models to avoid hallucination
   - Added instructions to acknowledge uncertainty rather than making up information
   - Tailored to each model's specific strengths and use cases

4. **GPU Utilization**:
   - Heavier models (Mistral, DeepSeek, StarCoder2, WizardMath, MetaMath) use GPU acceleration
   - Lighter models (Zephyr, Phi-2) run on CPU to optimize resource usage
   - GPU acceleration is managed through Ollama's configuration

### Monitoring GPU Usage

Run the included monitoring script to check GPU utilization:

```bash
./server/monitor_gpu_usage.sh
```

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
