# 🔐 Encriptar Datos Existentes

## Situación

Tienes datos en plain JSON en un repositorio privado y necesitas encriptarlos antes de hacerlo público.

## Solución: Token Temporal

Usa un token temporal solo para encriptar los datos, luego elimínalo.

### Paso 1: Crear Token Temporal

1. Ve a: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `temp-encrypt-data`
4. Expiration: **1 day** (lo más corto posible)
5. Scopes: Solo marca `repo`
6. Click "Generate token"
7. **Copia el token**

### Paso 2: Configurar Token en Local

Edita `src/environments/environment.ts` (solo local, NO hagas commit):

```typescript
export const environment = {
  production: false,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: 'ghp_TU_TOKEN_TEMPORAL_AQUI', // ⚠️ TEMPORAL
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  },
  storageConfig: 'TU_STORAGE_CONFIG_AQUI' // La que generaste
};
```

### Paso 3: Ejecutar la App Localmente

```bash
npm start
```

### Paso 4: Encriptar los Datos

1. Abre: http://localhost:4200
2. Inicia sesión
3. La app leerá los datos en plain JSON
4. Haz cualquier cambio pequeño (edita un expense)
5. Guarda
6. Los datos se guardarán encriptados en GitHub

### Paso 5: Verificar Encriptación

1. Ve a: https://github.com/Davix81/expenses-data/blob/main/data/expenses.json
2. Deberías ver texto encriptado, no JSON legible

### Paso 6: Limpiar

1. **Cierra la app local**
2. **Revierte los cambios en environment.ts:**
   ```bash
   git checkout src/environments/environment.ts
   ```
3. **Elimina el token temporal:**
   - Ve a: https://github.com/settings/tokens
   - Encuentra `temp-encrypt-data`
   - Click "Delete"

### Paso 7: Hacer el Repositorio Público

Ahora que los datos están encriptados:

1. Ve a: https://github.com/Davix81/expenses-data/settings
2. Danger Zone → Change visibility → Make public
3. Confirma

### Paso 8: Deploy de Producción

```bash
git add .
git commit -m "feat: configuración de almacenamiento"
git push origin master
```

### Paso 9: Verificar

1. Abre: https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. Deberías ver tus datos correctamente (desencriptados)
4. No más error 401

## ⚠️ Importante

- **NO hagas commit del token** en environment.ts
- **Elimina el token** inmediatamente después de usarlo
- **Verifica** que los datos están encriptados antes de hacer el repo público

## Alternativa Más Simple

Si no tienes datos importantes todavía:

1. Elimina los archivos actuales en `expenses-data`
2. Haz el repositorio público
3. Crea archivos vacíos:
   - `data/expenses.json` con `[]`
   - `data/settings.json` con `{}`
4. La app los encriptará automáticamente al usarla

## Verificación Final

Después de todo:
- ✅ Repositorio público
- ✅ Datos encriptados
- ✅ Token temporal eliminado
- ✅ App funciona sin error 401
- ✅ Solo tú tienes `STORAGE_CONFIG`
