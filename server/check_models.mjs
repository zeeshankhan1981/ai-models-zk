// Script to check which models are available in Ollama
const { exec } = import child_process from 'child_process';
const { promisify } = import util from 'util';
const fs = import fs from 'fs'.promises;
const path = import path from 'path';

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
    console.log('Raw ollama list output:');
    console.log(stdout);
    
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

// Function to manually add models we know are available
function addKnownModels(availableModels) {
  // These are models we know are available based on the ollama list output
  const knownModels = ['phi-2', 'llama3', 'codellama', 'zephyr', 'mistral'];
  
  // Add any missing models
  knownModels.forEach(model => {
    if (!availableModels.includes(model)) {
      availableModels.push(model);
    }
  });
  
  return availableModels;
}

async function updateModelsConfig() {
  try {
    // Get available models from Ollama
    let availableModels = await checkModelAvailability();
    
    // Add known models
    availableModels = addKnownModels(availableModels);
    console.log('Available models after adding known models:', availableModels);
    
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
    
    // Debug: Print all model IDs in the API file
    const allModelIds = modelObjects.map(modelObj => {
      const idMatch = modelObj.match(/id: ['"]([^'"]+)['"]/);
      return idMatch ? idMatch[1] : 'unknown';
    });
    console.log('All model IDs in API file:', allModelIds.join(', '));
    
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
      
      console.log(`Model ${modelId} available: ${isAvailable}`);
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
