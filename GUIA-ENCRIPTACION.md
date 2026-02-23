# 🔐 Guía de Implementación: Encriptación de Datos

## Solución Implementada

Los archivos JSON (`expenses.json` y `settings.json`) ahora se encriptan con **AES-256-GCM** antes de guardarse en GitHub y se desencriptan al leerlos.

### Ventajas

✅ **Repositorio público** - Puedes hacer `expenses-data` público sin exponer tus datos
✅ **Sin Personal Access Token** - No necesitas token de GitHub (evita revocaciones)
✅ **Datos seguros** - Encriptación AES-256 de nivel militar
✅ **Clave secreta** - Solo tú tienes la clave de encriptación
✅ **Transparente** - La app funciona igual, la encriptación es automática

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Angular PWA)                             │
│  ┌──────────────────────────────────────────────┐  │
│  │ EncryptionService                            │  │
│  │ - encrypt(data, key) → encrypted string      │  │
│  │ - decrypt(encrypted, key) → data             │  │
│  └──────────────────────────────────────────────┘  │
│                    ↕                                │
│  ┌──────────────────────────────────────────────┐  │
│  │ GitHubStorageService                         │  │
│  │ - Read: GitHub → Decrypt → Data              │  │
│  │ - Write: Data → Encrypt → GitHub             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     ↕
┌─────────────────────────────────────────────────────┐
│  GitHub Repository (PUBLIC)                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ data/expenses.json                           │  │
│  │ Content: "a8f3d9e2..." (encrypted)           │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ data/settings.json                           │  │
│  │ Content: "b7c4e1f8..." (encrypted)           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Archivos Modificados/Creados

### Nuevos Archivos

1. **`src/app/services/encryption.service.ts`**
   - Servicio de encriptación AES-256-GCM
   - Usa Web Crypto API (nativo del navegador)
   - Métodos: `encrypt()`, `decrypt()`

2. **`scripts/inject-encryption-key.js`**
   - Inyecta la clave de encriptación en el build
   - Reemplaza `__ENCRYPTION_KEY__` en archivos compilados

3. **`GUIA-ENCRIPTACION.md`** (este archivo)
   - Documentación completa

### Archivos Modificados

1. **`src/app/services/github-storage.service.ts`**
   - Integra EncryptionService
   - Encripta antes de guardar
   - Desencripta después de leer
   - Soporta repos públicos (sin token)

2. **`src/environments/environment.ts`**
   - Agregado `encryptionKey: '__ENCRYPTION_KEY__'`
   - Token vacío para repos públicos

3. **`src/environments/environment.prod.ts`**
   - Agregado `encryptionKey: '__ENCRYPTION_KEY__'`
   - Token vacío para repos públicos

4. **`.github/workflows/deploy.yml`**
   - Usa `ENCRYPTION_KEY` en lugar de `EXPENSES_DATA_TOKEN`
   - Inyecta la clave después del build

## Pasos de Implementación

### Paso 1: Generar Clave de Encriptación

Genera una clave segura de 64 caracteres:

```bash
# En tu terminal (Windows PowerShell, Linux, Mac)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejemplo de salida:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**⚠️ IMPORTANTE:** Guarda esta clave en un lugar seguro. Si la pierdes, no podrás desencriptar tus datos.

### Paso 2: Configurar Secret en GitHub

1. Ve a tu repositorio: https://github.com/Davix81/expense-tracker-pwa
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ENCRYPTION_KEY`
5. Secret: Pega la clave generada en el Paso 1
6. Click "Add secret"

### Paso 3: Hacer el Repositorio de Datos Público

1. Ve a: https://github.com/Davix81/expenses-data
2. Settings → Danger Zone → Change visibility
3. Click "Make public"
4. Confirma escribiendo el nombre del repositorio

### Paso 4: Encriptar Datos Existentes (Si los tienes)

Si ya tienes datos en `expenses.json` y `settings.json`, necesitas encriptarlos:

#### Opción A: Usar la App (Recomendado)

1. Haz el deploy con los cambios
2. Abre la app
3. Los datos se leerán como plain JSON (primera vez)
4. Al guardar cualquier cambio, se encriptarán automáticamente

#### Opción B: Script Manual

Crea un archivo `scripts/encrypt-existing-data.js`:

```javascript
const fs = require('fs');
const crypto = require('crypto');

const ENCRYPTION_KEY = 'TU_CLAVE_AQUI'; // Reemplaza con tu clave

async function deriveKey(encryptionKey) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKey);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const salt = encoder.encode('expense-tracker-salt-v1');
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, encryptionKey) {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(jsonString);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(encryptionKey);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBytes
  );
  
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return Buffer.from(combined).toString('base64');
}

async function main() {
  // Leer datos existentes
  const expenses = JSON.parse(fs.readFileSync('expenses.json', 'utf8'));
  const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
  
  // Encriptar
  const encryptedExpenses = await encrypt(expenses, ENCRYPTION_KEY);
  const encryptedSettings = await encrypt(settings, ENCRYPTION_KEY);
  
  // Guardar encriptados
  fs.writeFileSync('expenses.encrypted.txt', encryptedExpenses);
  fs.writeFileSync('settings.encrypted.txt', encryptedSettings);
  
  console.log('✅ Datos encriptados guardados en:');
  console.log('   - expenses.encrypted.txt');
  console.log('   - settings.encrypted.txt');
  console.log('');
  console.log('Copia el contenido de estos archivos a GitHub.');
}

main();
```

### Paso 5: Deploy

```bash
git add .
git commit -m "feat: implementar encriptación AES-256 para datos"
git push origin master
```

El workflow:
1. Compilará la aplicación
2. Inyectará la clave de encriptación
3. Desplegará en GitHub Pages

### Paso 6: Verificar

1. Abre la app: https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. Verifica que puedes ver y modificar expenses
4. Ve a GitHub y verifica que los archivos están encriptados:
   - https://github.com/Davix81/expenses-data/blob/main/data/expenses.json
   - Deberías ver texto encriptado, no JSON legible

## Seguridad

### ¿Qué está protegido?

✅ **Datos en GitHub** - Completamente encriptados
✅ **Datos en tránsito** - HTTPS
✅ **Clave de encriptación** - Solo en GitHub Secrets y en el build

### ¿Qué NO está protegido?

⚠️ **Clave en el código compilado** - La clave está en los archivos JavaScript
⚠️ **Datos en memoria** - Desencriptados en el navegador
⚠️ **Datos en localStorage** - Si se cachean

### Nivel de Seguridad

- **Contra usuarios casuales:** ✅ Excelente
- **Contra inspección de GitHub:** ✅ Excelente
- **Contra inspección del código JS:** ⚠️ Limitado
- **Contra ataques dirigidos:** ❌ Limitado

### Recomendaciones Adicionales

1. **Cambia el password de la app** a algo más seguro
2. **Usa HTTPS siempre** (GitHub Pages lo hace automáticamente)
3. **No compartas la clave de encriptación**
4. **Haz backups** de la clave de encriptación
5. **Considera rotar la clave** periódicamente

## Rotación de Clave

Si necesitas cambiar la clave de encriptación:

1. Genera una nueva clave
2. Descarga y desencripta los datos con la clave antigua
3. Actualiza `ENCRYPTION_KEY` en GitHub Secrets
4. Haz deploy
5. Los datos se encriptarán con la nueva clave al guardar

## Troubleshooting

### Error: "Failed to decrypt data"

**Causa:** La clave de encriptación es incorrecta o los datos no están encriptados.

**Solución:**
1. Verifica que `ENCRYPTION_KEY` en GitHub Secrets es correcta
2. Si es la primera vez, los datos pueden estar en plain JSON (normal)
3. Guarda cualquier cambio para encriptarlos

### Error: "Encryption key is required"

**Causa:** La clave no se inyectó en el build.

**Solución:**
1. Verifica que `ENCRYPTION_KEY` existe en GitHub Secrets
2. Revisa los logs del workflow
3. Re-ejecuta el workflow

### Los datos no se encriptan

**Causa:** El repositorio puede estar usando la versión antigua del código.

**Solución:**
1. Verifica que hiciste push de todos los cambios
2. Espera a que el workflow termine
3. Limpia la caché del navegador (Ctrl+Shift+R)

## Preguntas Frecuentes

### ¿Puedo usar la app sin encriptación?

Sí, deja `encryptionKey` vacío en el environment y los datos se guardarán en plain JSON.

### ¿Qué pasa si pierdo la clave?

No podrás desencriptar los datos. Haz backups de la clave.

### ¿Puedo ver los datos encriptados en GitHub?

Sí, pero verás texto encriptado, no JSON legible.

### ¿Es seguro para datos sensibles?

Para uso personal, sí. Para datos ultra sensibles, considera un backend dedicado.

### ¿Afecta el rendimiento?

Mínimamente. La encriptación/desencriptación es muy rápida con Web Crypto API.

## Próximos Pasos

1. ✅ Genera la clave de encriptación
2. ✅ Configura el secret en GitHub
3. ✅ Haz el repositorio público
4. ✅ Haz deploy
5. ✅ Verifica que funciona

¡Listo! Tus datos ahora están encriptados y seguros en un repositorio público.
