import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const nodeModulesDir = path.join(__dirname, '../node_modules/stockfish.js');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const filesToCopy = ['stockfish.js', 'stockfish.wasm.js', 'stockfish.wasm'];

filesToCopy.forEach(file => {
  try {
    const src = path.join(nodeModulesDir, file);
    const dest = path.join(publicDir, file);
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${file}:`, error.message);
    process.exit(1);
  }
});

console.log('✓ Stockfish files copied successfully');
