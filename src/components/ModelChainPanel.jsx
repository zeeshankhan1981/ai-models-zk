import React, { useState } from 'react';
import axios from 'axios';
import './ModelChainPanel.css';

const ModelChainPanel = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState({ gemma: '', mistral: '', zephyr: '', llama3: '' });
  const [finalOutput, setFinalOutput] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await axios.post('/api/chain/gemma-mistral-zephyr-llama3', { topic });
      setOutputs(response.data.stages);
      setFinalOutput(response.data.finalOutput);
    } catch (err) {
      setError('An error occurred while generating the article.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-input-container">
        <form className="chat-input-wrapper" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <textarea
            className="chat-textarea"
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
          />
          <button type="submit" className="send-button" disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Article'}
          </button>
        </form>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="chat-messages">
        <div className="output-pane">
          <h3>Gemma</h3>
          <p>{outputs.gemma}</p>
        </div>
        <div className="output-pane">
          <h3>Mistral</h3>
          <p>{outputs.mistral}</p>
        </div>
        <div className="output-pane">
          <h3>Zephyr</h3>
          <p>{outputs.zephyr}</p>
        </div>
        <div className="output-pane">
          <h3>LLaMA 3</h3>
          <p>{finalOutput}</p>
        </div>
      </div>
    </div>
  );
};

export default ModelChainPanel;
