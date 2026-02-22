# 🚀 Guía de Deploy: Backend Vercel + Frontend

## Arquitectura Implementada

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (GitHub Pages)                                 │
│  https://davix81.github.io/expense-tracker-pwa/         │
│                                                          │
│  - Angular PWA                                           │
│  - ApiStorageService                                     │
│  - Encriptación AES-256                                  │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTPS + Bearer Token
                 ▼
┌──────────────────────────────────────────────────────────┐
│  Backend API (Vercel Serverless)                         │
│  https://expense-tracker-api.vercel.app/api              │
│                                                          │
│  Endpoints:                                              │
│  - GET  /api/expenses                                    │
│  - PUT  /api/expenses                                    │
│  - GET  /api/settings                                    │
│  - PUT  /api/settings                                    │
└────────────────┬─────────────────────────────────────────┘
                 │ GitHub Token (seguro)
                 ▼
┌──────────────────────────────────────────────────────────┐
│  GitHub Repository (Público)                             │
│  https://github.com/Davix81/expenses-data               │
│                                                          │
│  - data/expenses.json (encriptado)                       │
│  - data/settings.json (encriptado)                       │
└──────────────────────────────────────────────────────────┘
```

## Paso 1: Preparar el Backend

### 1.1 Crear Repositorio Backend

```bash
cd expense-tracker-api
git init
git add .
git commit -m "Initial commit: Vercel backend API"
```

### 1.2 Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. Repository name: `expense-tracker-api`
3. Description: "Backend API for Expense Tracker PWA"
4. Public o Private (tu elección)
5. Click "Create repository"

### 1.3 Push al Repositorio

```bash
git remote add origin https://github.com/Davix81/expense-tracker-api.git
git branch -M main
git push -u origin main
```

## Paso 2: Deploy en Vercel

### 2.1 Crear Cuenta en Vercel

1. Ve a: https://vercel.com/signup
2. Regístrate con tu cuenta de GitHub
3. Autoriza Vercel para acceder a tus repositorios

### 2.2 Importar Proyecto

1. En Vercel Dashboard, click "Add New..." → "Project"
2. Busca `expense-tracker-api`
3. Click "Import"
4. Framework Preset: **Other** (detectará automáticamente)
5. Root Directory: `./` (dejar por defecto)
6. Click "Deploy" (por ahora, configuraremos variables después)

### 2.3 Configurar Variables de Entorno

Después del primer deploy:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:

#### Variables Requeridas:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GITHUB_TOKEN` | `ghp_...` | Personal Access Token con scope `repo` |
| `API_SECRET` | `[generar]` | Secret para autenticar peticiones del frontend |
| `GITHUB_OWNER` | `Davix81` | Tu username de GitHub |
| `GITHUB_REPO` | `expenses-data` | Nombre del repositorio de datos |
| `GITHUB_BRANCH` | `main` | Rama del repositorio |

#### Generar API_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como `API_SECRET`.

#### Crear GITHUB_TOKEN:

1. Ve a: https://github.com/settings/tokens
2. Generate new token (classic)
3. Name: `vercel-expense-tracker-api`
4. Expiration: No expiration (o el tiempo que prefieras)
5. Scopes: Marca `repo` (completo)
6. Generate token
7. **Copia el token inmediatamente**

### 2.4 Re-deploy

Después de configurar las variables:

1. En Vercel, ve a Deployments
2. Click en el último deployment
3. Click "..." → "Redeploy"
4. Marca "Use existing Build Cache"
5. Click "Redeploy"

### 2.5 Obtener URL de la API

Después del deploy:

1. Ve a tu proyecto en Vercel
2. Copia la URL del proyecto (ej: `https://expense-tracker-api.vercel.app`)
3. La URL completa de la API será: `https://expense-tracker-api.vercel.app/api`

## Paso 3: Configurar Frontend

### 3.1 Configurar Secrets en GitHub Actions

1. Ve a: https://github.com/Davix81/expense-tracker-pwa/settings/secrets/actions

2. Agrega/actualiza estos secrets:

| Secret | Valor | Descripción |
|--------|-------|-------------|
| `STORAGE_CONFIG` | `[ya existe]` | Configuración de encriptación (64 caracteres) |
| `API_URL` | `https://expense-tracker-api.vercel.app/api` | URL de tu API en Vercel |
| `API_SECRET` | `[mismo que en Vercel]` | El mismo API_SECRET que configuraste en Vercel |

### 3.2 Verificar Configuración

Asegúrate de que:
- ✅ `STORAGE_CONFIG` existe (si no, genera uno: `node scripts/generate-storage-config.js`)
- ✅ `API_URL` apunta a tu deployment de Vercel
- ✅ `API_SECRET` es el mismo en GitHub y Vercel

## Paso 4: Deploy Frontend

### 4.1 Commit y Push

```bash
cd expense-tracker-pwa
git add .
git commit -m "feat: integrar backend Vercel con encriptación"
git push origin master
```

### 4.2 Verificar Workflow

1. Ve a: https://github.com/Davix81/expense-tracker-pwa/actions
2. Verifica que el workflow se ejecuta correctamente
3. Busca en los logs:
   ```
   ✅ Configuration injection completed successfully!
   Storage Config preview: a1b2c3d4...
   API URL: https://expense-tracker-api.vercel.app/api
   API Secret preview: x9y8z7w6...
   ```

## Paso 5: Verificación

### 5.1 Probar la API

```bash
# Reemplaza con tus valores
API_URL="https://expense-tracker-api.vercel.app/api"
API_SECRET="tu_api_secret"

# Test GET expenses
curl -H "Authorization: Bearer $API_SECRET" \
     "$API_URL/expenses"

# Debería devolver [] o los datos encriptados
```

### 5.2 Probar la Aplicación

1. Abre: https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. Intenta crear un expense
4. Debería guardarse correctamente
5. Recarga la página
6. El expense debería aparecer

### 5.3 Verificar Encriptación

1. Ve a: https://github.com/Davix81/expenses-data/blob/main/data/expenses.json
2. Deberías ver texto encriptado, no JSON legible

## Troubleshooting

### Error: "API authentication failed"

**Causa:** `API_SECRET` no coincide entre frontend y backend.

**Solución:**
1. Verifica que `API_SECRET` en GitHub Secrets es el mismo que en Vercel
2. Re-deploy ambos proyectos

### Error: "Unable to connect to the API"

**Causa:** `API_URL` incorrecta o API no desplegada.

**Solución:**
1. Verifica que la API está desplegada en Vercel
2. Verifica que `API_URL` en GitHub Secrets es correcta
3. Prueba la URL manualmente con curl

### Error: "GitHub authentication failed" (en logs de Vercel)

**Causa:** `GITHUB_TOKEN` inválido o sin permisos.

**Solución:**
1. Verifica que el token tiene scope `repo`
2. Verifica que el token no ha expirado
3. Crea un nuevo token si es necesario

### Los datos no se encriptan

**Causa:** `STORAGE_CONFIG` no está configurado.

**Solución:**
1. Genera configuración: `node scripts/generate-storage-config.js`
2. Configura en GitHub Secrets
3. Re-deploy frontend

## Costos

### Vercel Free Tier

- ✅ 100GB bandwidth/mes
- ✅ 100 horas serverless/mes
- ✅ Suficiente para uso personal
- ✅ HTTPS automático
- ✅ Sin tarjeta de crédito requerida

### GitHub

- ✅ GitHub Pages: Gratis
- ✅ GitHub Actions: 2000 minutos/mes gratis
- ✅ Repositorios públicos: Gratis

**Total: $0/mes** 🎉

## Mantenimiento

### Actualizar Backend

```bash
cd expense-tracker-api
# Hacer cambios
git add .
git commit -m "Update: ..."
git push
# Vercel despliega automáticamente
```

### Actualizar Frontend

```bash
cd expense-tracker-pwa
# Hacer cambios
git add .
git commit -m "Update: ..."
git push
# GitHub Actions despliega automáticamente
```

### Rotar API_SECRET

1. Genera nuevo secret
2. Actualiza en Vercel
3. Actualiza en GitHub Secrets
4. Re-deploy ambos proyectos

### Rotar GITHUB_TOKEN

1. Crea nuevo token en GitHub
2. Actualiza en Vercel
3. Re-deploy backend
4. Revoca token antiguo

## Resumen

✅ Backend desplegado en Vercel
✅ Frontend desplegado en GitHub Pages
✅ Datos encriptados en repositorio público
✅ Token de GitHub seguro en Vercel
✅ API_SECRET protege la comunicación
✅ Todo gratis

## Próximos Pasos

1. ✅ Probar la aplicación completamente
2. ✅ Verificar que los datos se encriptan
3. ✅ Hacer backup de `STORAGE_CONFIG` y `API_SECRET`
4. ✅ Disfrutar de tu app funcionando! 🎉
