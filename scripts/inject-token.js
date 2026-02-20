const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const token = process.env.EXPENSES_DATA_TOKEN;

if (!token) {
  console.error('ERROR: EXPENSES_DATA_TOKEN environment variable is not set!');
  process.exit(1);
}

console.log('Reading environment.prod.ts...');
let content = fs.readFileSync(envPath, 'utf8');

// Verificar que el placeholder existe
if (!content.includes('PLACEHOLDER_GH_ACCESS_KEY')) {
  console.error('ERROR: Placeholder PLACEHOLDER_GH_ACCESS_KEY not found in environment.prod.ts!');
  process.exit(1);
}

console.log('Replacing token placeholder...');
content = content.replace(/'PLACEHOLDER_GH_ACCESS_KEY'/g, `'${token}'`);
content = content.replace(/"PLACEHOLDER_GH_ACCESS_KEY"/g, `"${token}"`);
content = content.replace(/PLACEHOLDER_GH_ACCESS_KEY/g, token);

console.log('Writing updated environment.prod.ts...');
fs.writeFileSync(envPath, content, 'utf8');

// Verificar que el reemplazo funcionó
const verifyContent = fs.readFileSync(envPath, 'utf8');
if (verifyContent.includes('PLACEHOLDER_GH_ACCESS_KEY')) {
  console.error('ERROR: Token replacement failed! Placeholder still exists.');
  process.exit(1);
}

console.log('✅ Token injected successfully!');

