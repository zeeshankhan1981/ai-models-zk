import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert CommonJS to ES modules
function convertFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Convert require statements to import
    let newContent = content
        .replace(/require\(['"]([^'"]+)['"]\)/g, (match, moduleName) => {
            return `import ${moduleName} from '${moduleName}'`;
        })
        .replace(/require\(['"]([^'"]+)['"]\)/g, (match, moduleName) => {
            return `import ${moduleName} from '${moduleName}'`;
        });
    
    // Convert module.exports to export
    newContent = newContent
        .replace(/module\.exports = /g, 'export default ')
        .replace(/module\.exports\./g, 'export ');
    
    // Convert exports. to export
    newContent = newContent
        .replace(/exports\./g, 'export ');
    
    // Add .mjs extension if needed
    const newFilePath = filePath.replace(/\.js$/, '.mjs');
    
    // Write the new content
    fs.writeFileSync(newFilePath, newContent, 'utf8');
    
    console.log(`Converted ${filePath} to ${newFilePath}`);
}

// Function to process directory
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            processDirectory(filePath);
        } else if (stats.isFile() && file.endsWith('.js')) {
            convertFile(filePath);
        }
    }
}

// Start conversion
processDirectory(__dirname);
