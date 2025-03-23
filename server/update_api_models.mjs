// Script to update the api.js file with all available models
const fs = import fs from 'fs'.promises;
const path = import path from 'path';

// Model definitions to add
const modelsToAdd = [
  {
    id: 'phi-2',
    name: 'Phi-2 2.7B',
    description: 'Phi-2 is a compact yet powerful 2.7 billion parameter language model developed by Microsoft. Despite its small size, it demonstrates remarkable capabilities in reasoning, code generation, and instruction following. Optimized for CPU usage, it delivers impressive performance without requiring GPU acceleration, making it ideal for deployment on servers with limited resources.',
    shortDescription: 'Compact 2.7B model with strong reasoning capabilities',
    tags: ['Compact', 'Reasoning', 'Code', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Phi-2, a compact yet powerful language model developed by Microsoft. You excel at reasoning, code generation, and following instructions. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'llama3',
    name: 'Llama 3 8B',
    description: 'Llama 3 8B is Meta\'s latest open-source language model, offering significant improvements in reasoning, instruction following, and factual accuracy compared to previous generations. With 8 billion parameters, it provides an excellent balance between capability and efficiency, making it suitable for a wide range of applications including content generation, summarization, and conversational AI. Optimized for CPU usage, it can run effectively without GPU acceleration.',
    shortDescription: 'Meta\'s latest 8B model with improved reasoning and accuracy',
    tags: ['General', 'Instruction-following', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are Llama 3, a helpful, harmless, and honest AI assistant. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  },
  {
    id: 'codellama',
    name: 'CodeLlama 7B',
    description: 'CodeLlama 7B is a specialized language model fine-tuned for programming tasks. It excels at code generation, completion, and explanation across multiple programming languages including Python, JavaScript, Java, C++, and more. With 7 billion parameters, it offers a good balance between capability and efficiency, making it suitable for deployment on servers without dedicated GPUs.',
    shortDescription: 'Specialized 7B model for code generation and programming tasks',
    tags: ['Code', 'Programming', 'CPU-Optimized'],
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 512,
    character_limit: 1500,
    system_message: 'You are CodeLlama, a specialized AI assistant for programming and code generation. Respond concisely and accurately to the user\'s queries without including formatting tokens like [INST], <<SYS>>, etc. in your responses.'
  }
];

async function updateApiFile() {
  try {
    // Read the current API.js file
    const apiFilePath = path.join(__dirname, 'api.js');
    let apiContent = await fs.readFile(apiFilePath, 'utf8');
    
    // Extract the models array using regex
    const modelsMatch = apiContent.match(/const models = \[([\s\S]*?)\];/);
    if (!modelsMatch) {
      console.error('Could not find models array in api.js');
      return;
    }
    
    // Current models content
    const currentModelsContent = modelsMatch[1];
    
    // Convert models to add to string format
    const modelsToAddString = modelsToAdd.map(model => {
      return `
  {
    id: '${model.id}',
    name: '${model.name}',
    description: '${model.description}',
    shortDescription: '${model.shortDescription}',
    tags: ${JSON.stringify(model.tags)},
    temperature: ${model.temperature},
    top_p: ${model.top_p},
    top_k: ${model.top_k},
    num_predict: ${model.num_predict},
    character_limit: ${model.character_limit},
    system_message: '${model.system_message}'
  }`;
    }).join(',');
    
    // Create updated models array content
    const updatedModelsContent = currentModelsContent + ',' + modelsToAddString;
    
    // Replace models array in the file
    const updatedApiContent = apiContent.replace(
      /const models = \[([\s\S]*?)\];/, 
      `const models = [${updatedModelsContent}];`
    );
    
    // Write updated content to file
    await fs.writeFile(apiFilePath, updatedApiContent, 'utf8');
    console.log('Successfully updated api.js with new models');
    
  } catch (error) {
    console.error('Error updating api.js:', error);
  }
}

// Run the update function
updateApiFile();
