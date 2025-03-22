// Script to check which models are available in Ollama
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Model mapping to handle different naming conventions
const MODEL_MAPPINGS = {
  'llama3': ['llama3', 'llama-3'],
  'llama2': ['llama2', 'llama-2'],
  'codellama': ['codellama', 'codellama-7b-code', 'code-llama'],
  'zephyr-7b': ['zephyr', 'zephyr-7b'],
  'phi-2': ['phi-2', 'phi2'],
  'mistral': ['mistral', 'mistral-7b'],
  'deepseek': ['deepseek', 'deepseek-coder'],
  'starcoder2': ['starcoder2', 'starcoder-2'],
  'starcoder': ['starcoder'],
  'metamath': ['metamath']
};

async function checkModelAvailability() {
  try {
    console.log('Checking available models in Ollama...');
    const { stdout } = await execAsync('ollama list');
    const availableModels = stdout.split('\n')
      .filter(line => line.trim() !== '' && !line.includes('NAME'))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const fullName = parts[0];
        return fullName.split(':')[0]; // Extract model name without version
      });
    
    console.log('Available models:', availableModels);
    return availableModels;
  } catch (error) {
    console.error('Error checking model availability:', error);
    return [];
  }
}

async function updateModelsConfig() {
  try {
    // Get available models from Ollama
    const availableModels = await checkModelAvailability();
    
    // Read the current API.js file
    const apiFilePath = path.join(__dirname, 'api.js');
    const apiContent = await fs.readFile(apiFilePath, 'utf8');
    
    // Extract the models array using regex
    const modelsMatch = apiContent.match(/const models = \[([\s\S]*?)\];/);
    if (!modelsMatch) {
      console.error('Could not find models array in api.js');
      return;
    }
    
    const modelsArrayContent = modelsMatch[1];
    
    // Split the models array into individual model objects
    const modelObjects = modelsArrayContent.split('},');
    
    // Filter models to only include those available in Ollama
    const filteredModels = modelObjects.filter(modelObj => {
      // Extract the model ID
      const idMatch = modelObj.match(/id: ['"]([^'"]+)['"]/);
      if (!idMatch) return false;
      
      const modelId = idMatch[1];
      
      // Check if any of the model's aliases are available
      const aliases = MODEL_MAPPINGS[modelId] || [modelId];
      const isAvailable = aliases.some(alias => 
        availableModels.some(availModel => 
          availModel.toLowerCase() === alias.toLowerCase()
        )
      );
      
      return isAvailable;
    });
    
    // Rebuild the models array
    const updatedModelsArray = filteredModels.map(model => 
      model.endsWith('}') ? model : model + '}'
    ).join(',');
    
    // Create a temporary file with the updated models
    const tempApiFilePath = path.join(__dirname, 'api_updated.js');
    const updatedApiContent = apiContent.replace(
      /const models = \[([\s\S]*?)\];/, 
      `const models = [${updatedModelsArray}];`
    );
    
    await fs.writeFile(tempApiFilePath, updatedApiContent, 'utf8');
    console.log(`Updated models configuration saved to ${tempApiFilePath}`);
    console.log(`Available models: ${filteredModels.length}`);
    
    // List the available model IDs
    const availableIds = filteredModels.map(model => {
      const idMatch = model.match(/id: ['"]([^'"]+)['"]/);
      return idMatch ? idMatch[1] : 'unknown';
    });
    console.log('Available model IDs:', availableIds.join(', '));
    
    // Copy the updated file to api.js
    await fs.copyFile(tempApiFilePath, apiFilePath);
    console.log('Updated api.js with available models');
    
  } catch (error) {
    console.error('Error updating models config:', error);
  }
}

// Run the update function
updateModelsConfig();
