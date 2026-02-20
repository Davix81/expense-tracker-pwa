/**
 * Script para inyectar el token de GitHub DESPUÉS del build
 * Reemplaza el placeholder en los archivos JavaScript compilados
 */

const fs = require('fs');
const path = require('path');

const token = process.env.EXPENSES_DATA_TOKEN;
const buildDir = path.join(__dirname, '../dist/expense-tracker-pwa/browser');

if (!token) {
  console.error('❌ ERROR: EXPENSES_DATA_TOKEN environment variable is not set!');
  process.exit(1);
}

console.log('🔍 Searching for JavaScript files in build directory...');
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
  const originalContent = content;

  // Contar ocurrencias antes del reemplazo
  const matches = content.match(/PLACEHOLDER_GH_ACCESS_KEY/g);

  if (matches && matches.length > 0) {
    console.log(`📝 Processing: ${path.basename(file)}`);
    console.log(`   Found ${matches.length} occurrence(s) of PLACEHOLDER_GH_ACCESS_KEY`);

    // Reemplazar todas las ocurrencias
    content = content.replace(/PLACEHOLDER_GH_ACCESS_KEY/g, token);

    // Verificar que el reemplazo funcionó
    if (content.includes('PLACEHOLDER_GH_ACCESS_KEY')) {
      console.error(`   ❌ ERROR: Replacement failed in ${file}`);
      process.exit(1);
    }

    // Escribir el archivo modificado
    fs.writeFileSync(file, content, 'utf8');

    filesModified++;
    occurrencesReplaced += matches.length;
    console.log(`   ✅ Replaced ${matches.length} occurrence(s)`);
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

// Verificación final: buscar cualquier archivo que todavía contenga el placeholder
console.log('🔍 Final verification...');
const verification = findJsFiles(buildDir);
let stillContainsPlaceholder = false;

verification.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('PLACEHOLDER_GH_ACCESS_KEY')) {
    console.error(`❌ ERROR: Placeholder still found in ${path.basename(file)}`);
    stillContainsPlaceholder = true;
  }
});

if (stillContainsPlaceholder) {
  console.error('');
  console.error('❌ VERIFICATION FAILED: Some files still contain the placeholder!');
  process.exit(1);
}

console.log('✅ Verification passed: No placeholders found in build');
console.log('');
console.log('✅ Token injection completed successfully!');
