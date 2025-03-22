# Averroes - Multi-Model AI Chat Interface

Averroes is a modern, elegant, and feature-rich interface for interacting with multiple Ollama models on your local machine. It provides a seamless way to chat with different AI models, compare their responses, and leverage their unique capabilities - all while keeping your data private and secure on your own hardware.

![Averroes Screenshot](screenshot.png)

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
- **Model-Specific Prompt Guides**: Access tailored prompting tips and examples for each model to get the best results

### User Interface
- **Light/Dark Mode**: Toggle between themes based on your preference
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Animated Transitions**: Smooth animations for a polished user experience
- **Loading Indicators**: Clear visual feedback during model processing
- **Infinite Scrolling**: Efficiently handle long conversations with virtualized list rendering
- **Scroll-to-Bottom Button**: Easily navigate to the latest messages in long conversations

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
- **Model-Specific Character Limits**: Automatically adjusts input limits based on each model's context window

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

## Prompt Guides

Averroes includes model-specific prompt guides to help you get the best results from each model. These guides provide:

1. **Best Use Cases**: Understanding what each model excels at
2. **Prompting Tips**: Strategies for crafting effective prompts for each model
3. **Example Prompts**: Ready-to-use examples that you can apply with a single click

To access the prompt guides:
1. Select a model from the dropdown
2. Click the "Prompt Guide" button below the chat input
3. Review the tips and examples for the selected model
4. Click on any example prompt to automatically apply it to your chat input

### Guide Implementation Details

The prompt guides are implemented as markdown files in the `public/prompt_guides/` directory. Each model has its own guide file that follows a consistent format:

```
# [Model Name] Prompt Guide

## Best For
- [Use case 1]
- [Use case 2]
- [Use case 3]

## Prompting Tips
- [Tip 1]
- [Tip 2]
- [Tip 3]

## Example Prompts
[Example prompt 1]

[Example prompt 2]
```

The `PromptGuide` component dynamically loads these markdown files based on the selected model and renders them with clickable example prompts that can be applied directly to the chat input.

## Project Structure

```
ai-models-zk/
├── public/                  # Static assets
│   ├── prompt_guides/       # Model-specific markdown guides
│   │   ├── mistral_latest.md
│   │   ├── llama2_latest.md
│   │   └── ...
├── server/                  # Backend API server
│   ├── api.js               # API endpoints and model definitions
│   └── package.json         # Backend dependencies
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── ChatInterface.jsx    # Main chat interface
│   │   ├── ModelSelector.jsx    # Model selection dropdown
│   │   ├── ModelInfo.jsx        # Model information display
│   │   ├── PromptGuide.jsx      # Prompt guide component
│   │   └── ThemeToggle.jsx      # Light/dark mode toggle
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── styles/              # CSS and styling
└── package.json             # Frontend dependencies
```

## API Reference

The Averroes API provides several endpoints for interacting with AI models:

### GET /api/models/check
Returns a list of available models and their status.

### POST /api/chat
Sends a message to a model and receives a complete response.

**Parameters:**
- `modelId` (string): The ID of the model to use
- `prompt` (string): The user's message
- `systemPrompt` (string, optional): Custom system instructions

### POST /api/chat/stream
Sends a message to a model and receives a streamed response.

**Parameters:**
- `modelId` (string): The ID of the model to use
- `prompt` (string): The user's message
- `messages` (array, optional): Full conversation history for context
- `systemPrompt` (string, optional): Custom system instructions

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

3. Create a prompt guide for the model:
   ```bash
   touch public/prompt_guides/model_name.md
   ```

4. Update the model mapping in `PromptGuide.jsx`:
   ```javascript
   const modelGuideMap = {
     // existing models...
     'model-id': 'model_name.md'
   };
   ```

### Modifying System Prompts

Each model has a custom system prompt that guides its behavior. These can be modified in `server/api.js` to better suit your specific needs.

### Styling

The application uses CSS variables for theming, making it easy to customize the look and feel. The main theme variables are defined in `src/App.css`.

## Performance Optimization

Averroes includes several optimizations for handling long conversations:

1. **Virtualized Rendering**: Only visible messages are rendered, improving performance
2. **Message Batching**: Messages are loaded in batches to reduce memory usage
3. **Automatic Cleanup**: Very long conversations are automatically trimmed
4. **Model-Specific Limits**: Character limits are tailored to each model's capabilities

## Troubleshooting

- **Models not loading**: Ensure Ollama is running (`ollama serve`) and the models have been pulled
- **Slow responses**: For GPU-intensive models, check your system resources and close other demanding applications
- **Connection errors**: Verify that the API server is running on port 3001 and accessible to the frontend
- **Formatting issues**: If model responses contain unexpected formatting tokens, you may need to update the cleaning patterns in `cleanModelResponse` function

## Version History

- **v2.6**: Added model-specific prompt guides and fixed API compatibility
- **v2.5**: Fixed scrolling issues and added scroll-to-bottom button
- **v2.4**: Implemented infinite scrolling with virtualization
- **v2.3**: Added model-specific character limits
- **v2.2**: Fixed model availability check for models with colons
- **v2.1**: Added response stopping capability
- **v2.0**: Redesigned UI with light/dark mode
- **v1.0**: Initial release with basic chat functionality

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
