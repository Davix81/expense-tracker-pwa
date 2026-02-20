/**
 * Script para probar si el token de GitHub funciona correctamente
 *
 * Uso:
 * EXPENSES_DATA_TOKEN=tu_token_aqui node scripts/test-token.js
 */

const https = require('https');

const token = process.env.EXPENSES_DATA_TOKEN;

if (!token) {
  console.error('❌ ERROR: EXPENSES_DATA_TOKEN no está definido');
  console.log('\nUso:');
  console.log('  EXPENSES_DATA_TOKEN=tu_token node scripts/test-token.js');
  process.exit(1);
}

console.log('🔍 Probando token de GitHub...');
// console.log('Token preview:', token.substring(0, 10) + '...');
// console.log('Token length:', token.length);
console.log('');

const options = {
  hostname: 'api.github.com',
  path: '/repos/Davix81/expenses-data/contents/data/expenses.json',
  method: 'GET',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'expense-tracker-test'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Token funciona correctamente!');
      console.log('');
      const response = JSON.parse(data);
      console.log('Archivo encontrado:', response.name);
      console.log('Tamaño:', response.size, 'bytes');
      console.log('SHA:', response.sha);
    } else if (res.statusCode === 401) {
      console.log('❌ ERROR 401: Token inválido o sin permisos');
      console.log('');
      console.log('Posibles causas:');
      console.log('1. El token no tiene el scope "repo"');
      console.log('2. El token ha expirado');
      console.log('3. El token no tiene acceso al repositorio expenses-data');
      console.log('');
      console.log('Respuesta:', data);
    } else if (res.statusCode === 404) {
      console.log('❌ ERROR 404: Archivo o repositorio no encontrado');
      console.log('');
      console.log('Verifica que:');
      console.log('1. El repositorio Davix81/expenses-data existe');
      console.log('2. El archivo data/expenses.json existe en el repositorio');
      console.log('');
      console.log('Respuesta:', data);
    } else {
      console.log('❌ ERROR:', res.statusCode);
      console.log('Respuesta:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error de conexión:', e.message);
});

req.end();
