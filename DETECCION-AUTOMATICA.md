# 🔍 Detección Automática de Formato

## Problema Resuelto

La aplicación ahora detecta automáticamente si los datos están encriptados o en plain JSON, eliminando errores de desencriptación.

## Cómo Funciona

### Detección Inteligente

Cuando la app lee datos de GitHub, analiza el contenido:

```typescript
// Si el contenido empieza con [ o {
if (content.startsWith('[') || content.startsWith('{')) {
  // Es JSON plano → parsear directamente
  return JSON.parse(content);
}

// Si no, probablemente está encriptado
if (storageConfig) {
  // Intentar desencriptar
  return decrypt(content, storageConfig);
}
```

### Flujo de Lectura

```
1. Descargar de GitHub (Base64)
   ↓
2. Decodificar Base64 → String
   ↓
3. Detectar formato:
   - ¿Empieza con [ o {? → JSON plano
   - ¿Otra cosa? → Encriptado
   ↓
4. Procesar según formato
   ↓
5. Devolver datos
```

## Ventajas

✅ **Migración automática** - Lee datos viejos (plain JSON) y nuevos (encriptados)
✅ **Sin errores** - No falla si los datos no están encriptados todavía
✅ **Transparente** - El usuario no nota la diferencia
✅ **Fallback inteligente** - Si falla la desencriptación, intenta JSON

## Casos de Uso

### Caso 1: Primera Vez (Sin Datos)

```
1. App intenta leer expenses.json
2. Archivo no existe (404)
3. Devuelve array vacío []
4. Usuario crea primer expense
5. Se guarda encriptado
```

### Caso 2: Datos Existentes en Plain JSON

```
1. App lee expenses.json
2. Detecta formato JSON (empieza con [)
3. Parsea como JSON
4. Usuario ve sus datos
5. Al guardar, se encriptan automáticamente
```

### Caso 3: Datos Ya Encriptados

```
1. App lee expenses.json
2. Detecta formato encriptado (no empieza con [ o {)
3. Desencripta con storageConfig
4. Usuario ve sus datos
5. Al guardar, se encriptan de nuevo
```

### Caso 4: Error de Configuración

```
1. App lee expenses.json
2. Detecta formato encriptado
3. No hay storageConfig o es incorrecta
4. Muestra error: "Storage configuration required"
5. Usuario debe configurar STORAGE_CONFIG
```

## Logs en Consola

La app muestra logs para debugging:

```javascript
// Cuando detecta JSON plano
"Detected plain JSON format"

// Cuando detecta encriptado
"Detected encrypted format, attempting to decrypt"

// Si falla desencriptación
"Failed to decrypt: [error]"
"Attempting to parse as JSON fallback"

// Si no hay configuración
"Data appears to be encrypted but no storage configuration provided"
```

## Migración Automática

### Escenario: Tienes datos en plain JSON

1. **Antes del deploy con encriptación:**
   - Datos: `[{"id": "1", "amount": 100}]` (plain JSON)

2. **Después del deploy:**
   - App lee: Detecta JSON plano ✅
   - Usuario ve datos correctamente ✅

3. **Usuario hace un cambio:**
   - App guarda: Encripta automáticamente ✅
   - Datos: `a8f3d9e2b7c4...` (encriptado)

4. **Próxima lectura:**
   - App lee: Detecta encriptado ✅
   - Desencripta con storageConfig ✅
   - Usuario ve datos correctamente ✅

### No Requiere Acción Manual

- ✅ No necesitas encriptar datos manualmente
- ✅ No necesitas migración de datos
- ✅ La transición es automática y transparente

## Verificación

### Comprobar el Formato Actual

1. Ve a: https://github.com/Davix81/expenses-data/blob/main/data/expenses.json

2. **Si ves esto (JSON plano):**
   ```json
   [
     {
       "id": "123",
       "amount": 100
     }
   ]
   ```
   → La app lo leerá correctamente y lo encriptará al guardar

3. **Si ves esto (encriptado):**
   ```
   a8f3d9e2b7c4e1f8...
   ```
   → La app lo desencriptará con tu storageConfig

## Troubleshooting

### Error: "Storage configuration required"

**Causa:** Los datos están encriptados pero no hay `STORAGE_CONFIG`.

**Solución:**
1. Genera configuración: `node scripts/generate-storage-config.js`
2. Configura secret en GitHub Actions
3. Haz deploy

### Error: "Failed to decrypt data"

**Causa:** La configuración es incorrecta.

**Solución:**
1. Verifica que `STORAGE_CONFIG` en GitHub Secrets es correcta
2. Si perdiste la configuración, los datos no son recuperables
3. Puedes eliminar los archivos y empezar de nuevo

### Los datos no se encriptan

**Causa:** No se ha guardado nada después del deploy.

**Solución:**
1. Haz cualquier cambio en la app (edita un expense)
2. Guarda
3. Los datos se encriptarán automáticamente

## Código Relevante

El método `parseContent()` en `github-storage.service.ts` maneja la detección:

```typescript
private async parseContent(content: string): Promise<any> {
  const trimmedContent = content.trim();
  
  // Detectar JSON
  if (trimmedContent.startsWith('[') || trimmedContent.startsWith('{')) {
    return JSON.parse(trimmedContent);
  }
  
  // Detectar encriptado
  if (this.dataConfig) {
    return await this.encryptionService.decrypt(trimmedContent, this.dataConfig);
  }
  
  throw new Error('Storage configuration required');
}
```

## Resumen

- ✅ Detección automática de formato
- ✅ Soporta JSON plano y encriptado
- ✅ Migración transparente
- ✅ Fallback inteligente
- ✅ Logs para debugging
