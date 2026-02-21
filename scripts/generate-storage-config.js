/**
 * Script para generar una configuración de almacenamiento segura
 * 
 * Uso:
 *   node scripts/generate-storage-config.js
 */

const crypto = require('crypto');

console.log('🔧 Generando configuración de almacenamiento...');
console.log('');

// Generar 32 bytes aleatorios (256 bits)
const config = crypto.randomBytes(32).toString('hex');

console.log('✅ Configuración generada exitosamente!');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('STORAGE CONFIGURATION:');
console.log('');
console.log(config);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('');
console.log('1. GUARDA ESTA CONFIGURACIÓN EN UN LUGAR SEGURO');
console.log('   Si la pierdes, no podrás acceder a tus datos.');
console.log('');
console.log('2. NO LA COMPARTAS CON NADIE');
console.log('   Esta configuración protege tus datos personales.');
console.log('');
console.log('3. AGRÉGALA COMO SECRET EN GITHUB:');
console.log('   - Ve a: https://github.com/Davix81/expense-tracker-pwa/settings/secrets/actions');
console.log('   - Click "New repository secret"');
console.log('   - Name: STORAGE_CONFIG');
console.log('   - Secret: Pega la configuración de arriba');
console.log('   - Click "Add secret"');
console.log('');
console.log('4. HAZ BACKUP DE LA CONFIGURACIÓN');
console.log('   Guárdala en un gestor de contraseñas o archivo seguro.');
console.log('');
console.log('Longitud: 64 caracteres');
console.log('');
