/**
 * Script para inyectar configuraciones DESPUÉS del build
 * Reemplaza los placeholders en los archivos JavaScript compilados
 */

const fs = require('fs');
const path = require('path');

const storageConfig = process.env.STORAGE_CONFIG;
const apiUrl = process.env.API_URL;
const apiSecret = process.env.API_SECRET;
const buildDir = path.join(__dirname, '../dist/expense-tracker-pwa/browser');

// Validar variables requeridas
if (!storageConfig) {
  console.error('❌ ERROR: STORAGE_CONFIG environment variable is not set!');
  process.exit(1);
}

if (!apiUrl) {
  console.error('❌ ERROR: API_URL environment variable is not set!');
  process.exit(1);
}

if (!apiSecret) {
  console.error('❌ ERROR: API_SECRET environment variable is not set!');
  process.exit(1);
}

console.log('🔧 Injecting configurations into build...');
console.log('Build directory:', buildDir);

// Función recursiva para encontrar todos los archivos .js
function findJsFiles(dir) {
  let results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findJsFiles(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

const jsFiles = findJsFiles(buildDir);

if (jsFiles.length === 0) {
  console.error('❌ ERROR: No JavaScript files found in build directory!');
  console.error('Make sure the build has completed successfully.');
  process.exit(1);
}

console.log(`Found ${jsFiles.length} JavaScript files`);
console.log('');

let filesModified = 0;
let occurrencesReplaced = 0;

jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Reemplazar STORAGE_CONFIG
  const storageMatches = content.match(/__STORAGE_CONFIG__/g);
  if (storageMatches && storageMatches.length > 0) {
    console.log(`📝 Processing: ${path.basename(file)}`);
    console.log(`   Found ${storageMatches.length} occurrence(s) of __STORAGE_CONFIG__`);
    content = content.replace(/__STORAGE_CONFIG__/g, storageConfig);
    modified = true;
    occurrencesReplaced += storageMatches.length;
  }
  
  // Reemplazar API_URL
  const apiUrlMatches = content.match(/__API_URL__/g);
  if (apiUrlMatches && apiUrlMatches.length > 0) {
    if (!modified) {
      console.log(`📝 Processing: ${path.basename(file)}`);
    }
    console.log(`   Found ${apiUrlMatches.length} occurrence(s) of __API_URL__`);
    content = content.replace(/__API_URL__/g, apiUrl);
    modified = true;
    occurrencesReplaced += apiUrlMatches.length;
  }
  
  // Reemplazar API_SECRET
  const apiSecretMatches = content.match(/__API_SECRET__/g);
  if (apiSecretMatches && apiSecretMatches.length > 0) {
    if (!modified) {
      console.log(`📝 Processing: ${path.basename(file)}`);
    }
    console.log(`   Found ${apiSecretMatches.length} occurrence(s) of __API_SECRET__`);
    content = content.replace(/__API_SECRET__/g, apiSecret);
    modified = true;
    occurrencesReplaced += apiSecretMatches.length;
  }
  
  if (modified) {
    // Verificar que los reemplazos funcionaron
    if (content.includes('__STORAGE_CONFIG__') || 
        content.includes('__API_URL__') || 
        content.includes('__API_SECRET__')) {
      console.error(`   ❌ ERROR: Replacement failed in ${file}`);
      process.exit(1);
    }
    
    // Escribir el archivo modificado
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
    console.log(`   ✅ Replacements completed`);
    console.log('');
  }
});

console.log('═══════════════════════════════════════');
console.log('📊 Summary:');
console.log(`   Files scanned: ${jsFiles.length}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${occurrencesReplaced}`);
console.log('');

if (filesModified === 0) {
  console.warn('⚠️  WARNING: No files were modified!');
  console.warn('   This might indicate that:');
  console.warn('   1. The placeholder was already replaced');
  console.warn('   2. The build is using a different placeholder');
  console.warn('   3. The environment file is not being included in the build');
  process.exit(1);
}

// Verificación final
console.log('🔍 Final verification...');
const verification = findJsFiles(buildDir);
let stillContainsPlaceholder = false;

verification.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('__STORAGE_CONFIG__') || 
      content.includes('__API_URL__') || 
      content.includes('__API_SECRET__')) {
    console.error(`❌ ERROR: Placeholder still found in ${path.basename(file)}`);
    stillContainsPlaceholder = true;
  }
});

if (stillContainsPlaceholder) {
  console.error('');
  console.error('❌ VERIFICATION FAILED: Some files still contain placeholders!');
  process.exit(1);
}

console.log('✅ Verification passed: No placeholders found in build');
console.log('');
console.log('✅ Configuration injection completed successfully!');
console.log('Storage Config preview:', storageConfig.substring(0, 8) + '...');
console.log('API URL:', apiUrl);
console.log('API Secret preview:', apiSecret.substring(0, 8) + '...');
