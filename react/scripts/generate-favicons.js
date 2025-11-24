import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../../new/assets/images/sam-favicon.svg');
const outputDir = path.join(__dirname, '../../new/assets/images');

// Read SVG file
const svgBuffer = fs.readFileSync(svgPath);

// Sizes needed for different devices
const sizes = [
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // iOS
  { size: 192, name: 'android-chrome-192x192.png' }, // Android
  { size: 512, name: 'android-chrome-512x512.png' }, // Android
];

async function generateFavicons() {
  console.log('Generating favicons from SVG...');
  
  for (const { size, name } of sizes) {
    const outputPath = path.join(outputDir, name);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }
  
  console.log('\nAll favicons generated successfully!');
}

generateFavicons().catch(console.error);
