import { readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

// Directories to scan
const dirsToScan = [
  './src',
  './server',
];

// Files to ignore
const ignorePatterns = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  '.env',
];

// Output file
const outputFile = 'app-structure.txt';

function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

function scanDirectory(dir, prefix = '') {
  let result = '';
  
  try {
    const files = readdirSync(dir);
    
    files.forEach(file => {
      const filePath = join(dir, file);
      
      if (shouldIgnore(filePath)) {
        return;
      }
      
      const stats = statSync(filePath);
      
      if (stats.isDirectory()) {
        result += `${prefix}📁 ${file}/\n`;
        result += scanDirectory(filePath, prefix + '  ');
      } else {
        result += `${prefix}📄 ${file}\n`;
      }
    });
  } catch (err) {
    result += `${prefix}❌ Error reading directory: ${err.message}\n`;
  }
  
  return result;
}

let output = '# App Structure\n';
output += `Generated on ${new Date().toISOString()}\n\n`;

dirsToScan.forEach(dir => {
  output += `## ${dir}\n`;
  output += scanDirectory(dir);
  output += '\n';
});

writeFileSync(outputFile, output);
console.log(`App structure written to ${outputFile}`);