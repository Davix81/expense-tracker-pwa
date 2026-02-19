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

console.log('Replacing token placeholder...');
content = content.replace('__GITHUB_TOKEN__', token);

console.log('Writing updated environment.prod.ts...');
fs.writeFileSync(envPath, content, 'utf8');

console.log('Token injected successfully!');
console.log('Token preview:', token.substring(0, 10) + '...');
