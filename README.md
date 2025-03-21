# LocalMind - Your Personal AI Hub

LocalMind is a modern, sleek, and interactive UI for interacting with multiple Ollama models on your local machine. It leverages the GPU capabilities of Apple Silicon Macs for faster inference with larger models.

![LocalMind Screenshot](screenshot.png)

## Features

- **Multiple Model Support**: Switch between different models like Mistral, DeepSeek, StarCoder2, Zephyr, Phi-2, WizardMath, and MetaMath
- **GPU Acceleration**: Automatically uses Metal acceleration on Apple Silicon Macs for larger models
- **Streaming Responses**: See model responses as they're generated in real-time
- **Code Highlighting**: Beautiful syntax highlighting for code responses
- **Chat History**: Conversations are saved locally in your browser
- **Light/Dark Mode**: Choose your preferred theme
- **Responsive Design**: Works well on both desktop and mobile devices

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Ollama](https://ollama.ai/) installed on your Mac

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/localmind.git
   cd localmind
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. Set up Ollama models:
   ```bash
   cd server
   chmod +x setup_ollama.sh
   ./setup_ollama.sh
   ```

4. Start the models:
   ```bash
   ./start_models.sh
   ```

5. Start the backend API server:
   ```bash
   npm start
   ```

6. In a new terminal, start the frontend:
   ```bash
   cd ..
   npm run dev
   ```

7. Open your browser and navigate to http://localhost:5173

## Model Configuration

LocalMind supports the following models:

| Model | Description | GPU Acceleration |
|-------|-------------|------------------|
| Mistral | A balanced model with good instruction following capabilities | No |
| DeepSeek | Specialized for code generation and understanding | No |
| StarCoder2 | Advanced code generation and completion | Yes |
| Zephyr | A balanced model with good instruction following capabilities | No |
| Phi-2 | A small but powerful model for general tasks | No |
| WizardMath | Specialized for mathematical problem solving | Yes |
| MetaMath | Specialized for advanced mathematical reasoning and formal proofs | Yes |

## GPU Acceleration

The application automatically uses GPU acceleration for larger models that benefit from it. On Apple Silicon Macs, this uses Metal acceleration which can provide 2-4x faster inference.

You can monitor GPU usage with Activity Monitor on your Mac.

## Troubleshooting

- **Models not loading**: Make sure Ollama is running and the models have been pulled with `./setup_ollama.sh`
- **Slow responses**: For larger models, ensure GPU acceleration is enabled in the `start_models.sh` script
- **Memory issues**: If running multiple GPU-accelerated models, you might need to close some to free up memory

## License

MIT

## Acknowledgements

- [Ollama](https://ollama.ai/) for the amazing local LLM runtime
- [React](https://reactjs.org/) for the UI framework
- [Express](https://expressjs.com/) for the backend API
- [Framer Motion](https://www.framer.com/motion/) for animations
