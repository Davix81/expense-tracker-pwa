# 💻 Desarrollo Local con Token

## Para Desarrollo y Testing

Si necesitas probar la funcionalidad de escritura localmente:

### Paso 1: Crear Token de Desarrollo

1. Ve a: https://github.com/settings/tokens
2. Generate new token (classic)
3. Name: `dev-expense-tracker`
4. Expiration: 7 days
5. Scopes: `repo`
6. Generate token
7. Copia el token

### Paso 2: Configurar Localmente

Edita `src/environments/environment.ts` (NO hagas commit):

```typescript
export const environment = {
  production: false,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: 'ghp_TU_TOKEN_DE_DESARROLLO', // ⚠️ SOLO LOCAL
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  },
  storageConfig: 'TU_STORAGE_CONFIG' // La que generaste
};
```

### Paso 3: Ejecutar Localmente

```bash
npm start
```

Ahora puedes:
- ✅ Leer datos
- ✅ Escribir datos
- ✅ Probar encriptación

### Paso 4: Limpiar Antes de Commit

**IMPORTANTE:** Antes de hacer commit:

```bash
# Revertir cambios en environment.ts
git checkout src/environments/environment.ts

# O verificar que no está en staging
git status
```

### ⚠️ NUNCA Hagas Commit del Token

Agrega a `.gitignore` si no está:

```
# Local environment with token
src/environments/environment.local.ts
```

Y usa `environment.local.ts` para desarrollo:

```typescript
// environment.local.ts (gitignored)
export const environment = {
  production: false,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: 'ghp_TU_TOKEN',
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  },
  storageConfig: 'TU_CONFIG'
};
```

## Solo para Desarrollo

Esta solución es SOLO para desarrollo local. Para producción, necesitas:
- Backend proxy (Vercel, Netlify, etc.)
- O modo solo lectura
