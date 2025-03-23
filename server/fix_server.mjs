// Script to fix server.js to work with CommonJS modules
const fs = import fs from 'fs'.promises;
const path = import path from 'path';

async function fixServerFile() {
  try {
    const serverFilePath = path.join(__dirname, '..', 'server.js');
    let serverContent = await fs.readFile(serverFilePath, 'utf8');
    
    // Replace ESM import with CommonJS require for api.js
    const updatedContent = serverContent.replace(
      /import pkg from '.\/server\/api.js';\nconst \{ models, getResponse, streamResponse, checkModelAvailability, getAvailableModels \} = pkg;/,
      `// Import api.js using CommonJS
const apiModule = import ./server/api.js from './server/api.js';
const models = apiModule.models || [];
const getResponse = apiModule.getResponse;
const streamResponse = apiModule.streamResponse;
const checkModelAvailability = apiModule.checkModelAvailability;
const getAvailableModels = apiModule.getAvailableModels;`
    );
    
    // Create a backup of the original file
    await fs.writeFile(`${serverFilePath}.bak`, serverContent, 'utf8');
    console.log(`Created backup of server.js at ${serverFilePath}.bak`);
    
    // Write the updated content
    await fs.writeFile(serverFilePath, updatedContent, 'utf8');
    console.log('Successfully updated server.js to use CommonJS require');
    
  } catch (error) {
    console.error('Error fixing server.js:', error);
  }
}

// Run the fix function
fixServerFile();
