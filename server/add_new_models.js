#!/usr/bin/env node

/**
 * Script to add new models to the server.cjs file
 * This script will add Llama 2 and Gemma models to the application
 */

const fs = require('fs');
const path = require('path');

// Define new models to add
const newModels = [
  {
    id: 'llama2',
    name: 'Llama 2 7B',
    description: 'Llama 2 is Meta\'s next-generation open-source large language model, offering improved performance and safety compared to its predecessor. With 7 billion parameters, it provides a good balance between capability and efficiency, making it suitable for a wide range of applications including content generation, summarization, and conversational AI. Optimized for CPU usage, it can run effectively without GPU acceleration.',
    shortDescription: 'Meta\'s 7B model with strong performance and safety features',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Llama 2, a helpful AI assistant. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'gemma',
    name: 'Gemma 2B',
    description: 'Gemma is Google\'s lightweight and capable open model, built from the same research and technology used to create Gemini models. With only 2 billion parameters, it delivers impressive performance while being extremely efficient, making it ideal for deployment on servers with limited resources. It excels at instruction following, coding tasks, and general knowledge questions.',
    shortDescription: 'Google\'s lightweight 2B model with excellent efficiency',
    tags: ['Compact', 'Efficient', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Gemma, a helpful and harmless AI assistant created by Google. Respond concisely and accurately to the user\'s queries without including formatting tokens in your responses.'
  }
];

// Function to add new models to the server file
async function addNewModels() {
  try {
    const serverFilePath = path.join(__dirname, '..', 'server.cjs');
    
    // Check if the file exists
    if (!fs.existsSync(serverFilePath)) {
      console.error(`Server file not found at ${serverFilePath}`);
      return;
    }
    
    // Read the server file
    let serverContent = fs.readFileSync(serverFilePath, 'utf8');
    
    // Find the models array in the file
    const modelsArrayStart = serverContent.indexOf('const models = [');
    if (modelsArrayStart === -1) {
      console.error('Models array not found in server file');
      return;
    }
    
    // Find the end of the models array
    let bracketCount = 1;
    let modelsArrayEnd = modelsArrayStart + 'const models = ['.length;
    
    while (bracketCount > 0 && modelsArrayEnd < serverContent.length) {
      if (serverContent[modelsArrayEnd] === '[') bracketCount++;
      if (serverContent[modelsArrayEnd] === ']') bracketCount--;
      modelsArrayEnd++;
    }
    
    // Extract the models array
    const modelsArray = serverContent.substring(modelsArrayStart, modelsArrayEnd);
    
    // Check if the models already exist
    for (const model of newModels) {
      if (modelsArray.includes(`id: '${model.id}'`)) {
        console.log(`Model ${model.id} already exists in the server file`);
        continue;
      }
      
      // Create the model string
      const modelString = `
  {
    id: '${model.id}',
    name: '${model.name}',
    description: '${model.description}',
    shortDescription: '${model.shortDescription}',
    tags: [${model.tags.map(tag => `'${tag}'`).join(', ')}],
    temperature: ${model.temperature},
    top_p: ${model.top_p},
    top_k: ${model.top_k},
    num_predict: ${model.num_predict},
    character_limit: ${model.character_limit},
    system_message: '${model.system_message}'
  },`;
      
      // Insert the model into the array
      const insertPosition = modelsArrayEnd - 1;
      serverContent = serverContent.slice(0, insertPosition) + modelString + serverContent.slice(insertPosition);
      
      console.log(`Added model ${model.id} to the server file`);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(serverFilePath, serverContent, 'utf8');
    console.log('Successfully updated server file with new models');
    
    // Create a backup of the original file
    fs.writeFileSync(`${serverFilePath}.bak`, serverContent, 'utf8');
    console.log(`Created backup of server file at ${serverFilePath}.bak`);
    
  } catch (error) {
    console.error('Error adding new models:', error);
  }
}

// Run the function
addNewModels();
