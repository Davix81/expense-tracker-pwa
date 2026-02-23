# Solución al Error 401 en GitHub API

## ✅ SOLUCIÓN IMPLEMENTADA

He identificado y solucionado el problema: GitHub estaba detectando el placeholder `__GITHUB_TOKEN__` en los archivos JavaScript compilados y revocando el token por seguridad.

### Cambios Realizados

1. **Nuevo script post-build** (`scripts/inject-token-post-build.js`)
   - Inyecta el token DESPUÉS de compilar la aplicación
   - Busca y reemplaza el placeholder en todos los archivos `.js`
   - Verifica que no queden placeholders
   - Usa solo módulos nativos de Node.js (sin dependencias)

2. **Workflow actualizado** (`.github/workflows/deploy.yml`)
   - Orden correcto: Build → Inject Token → Deploy
   - El token se inyecta en los archivos compilados, no en el código fuente
   - Más confiable y no depende del cache de Angular

3. **Scripts de prueba y documentación**
   - `test-token.js`: Para probar el token localmente
   - `PROBLEMA-IDENTIFICADO.md`: Explicación detallada del problema
   - `TOKEN-SETUP.md`: Guía para configurar el token

## Acciones Requeridas (IMPORTANTE)

### Paso 1: Crear un Nuevo Token de GitHub

El token anterior fue revocado por GitHub. Necesitas crear uno nuevo:

1. Ve a https://github.com/settings/tokens
2. Click en "Generate new token" → "Generate new token (classic)"
3. Nombre: `expense-tracker-pwa-token`
4. Expiration: Elige la duración deseada
5. **Selecciona estos scopes:**
   - ✅ `repo` (marca toda la sección completa)
6. Click en "Generate token"
7. **COPIA EL TOKEN INMEDIATAMENTE**

### Paso 2: Probar el Token Localmente (Opcional pero Recomendado)

```bash
# Windows CMD
set EXPENSES_DATA_TOKEN=tu_token_aqui
node scripts/test-token.js

# Windows PowerShell
$env:EXPENSES_DATA_TOKEN="tu_token_aqui"
node scripts/test-token.js
```

Deberías ver: `✅ Token funciona correctamente!`

### Paso 3: Actualizar el Secret en GitHub

1. Ve a https://github.com/Davix81/expense-tracker-pwa/settings/secrets/actions
2. Busca `EXPENSES_DATA_TOKEN`
3. Click en "Update" (o elimínalo y créalo de nuevo)
4. Pega el nuevo token
5. Click en "Update secret"

### Paso 4: Verificar el Repositorio de Datos

Asegúrate de que existe: https://github.com/Davix81/expenses-data

Y que tiene esta estructura:
```
expenses-data/
└── data/
    ├── expenses.json
    └── settings.json
```

Si no existe, créalo y agrega los archivos con contenido inicial:

**data/expenses.json:**
```json
[]
```

**data/settings.json:**
```json
{
  "categories": ["Subministraments", "Lloguer/Hipoteca", "Assegurança"],
  "tags": ["Hogar", "Transporte", "Entretenimiento"],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### Paso 5: Hacer Push y Desplegar

```bash
git add .
git commit -m "fix: inyectar token post-build para evitar exposición"
git push origin master
```

El workflow se ejecutará automáticamente.

### Paso 6: Verificar el Workflow

1. Ve a https://github.com/Davix81/expense-tracker-pwa/actions
2. Selecciona el workflow más reciente
3. Revisa los logs del paso "Inject GitHub Token into Build"
4. Deberías ver:
   ```
   ✅ Token injection completed successfully!
   Token preview: ghp_xxxxx...
   ```

### Paso 7: Verificar la Aplicación

1. Abre https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. Abre la consola del navegador (F12)
4. No deberías ver errores 401

## Por Qué Funcionará Ahora

### Problema Anterior
```
Modificar environment.prod.ts → Build (usa cache) → Placeholder en JS → GitHub lo detecta → Revoca token
```

### Solución Nueva
```
Build con placeholder → Reemplazar en archivos .js → Token real en JS → Deploy → ✅ Funciona
```

## Verificación de Seguridad

El token NO estará visible en el código desplegado porque:

1. Se inyecta DESPUÉS de compilar
2. Solo existe en los archivos `.js` minificados
3. El script verifica que no queden placeholders
4. GitHub no puede detectarlo como token expuesto

## Checklist Final

- [ ] Nuevo token creado con scope `repo` completo
- [ ] Token probado localmente con `test-token.js` (opcional)
- [ ] Repositorio `expenses-data` existe con archivos correctos
- [ ] Secret `EXPENSES_DATA_TOKEN` actualizado en GitHub Actions
- [ ] Cambios commiteados y pusheados
- [ ] Workflow ejecutado exitosamente
- [ ] Logs muestran "Token injection completed successfully"
- [ ] Aplicación desplegada sin errores 401

## Si Todavía Tienes Problemas

1. **Verifica los logs del workflow** - Busca errores en el paso de inyección
2. **Verifica que el token no ha expirado** - Crea uno nuevo si es necesario
3. **Verifica los permisos del token** - Debe tener scope `repo` completo
4. **Verifica que el repositorio expenses-data existe** - Y que el token tiene acceso

## Contacto

Si después de seguir todos estos pasos sigues teniendo problemas, revisa:
- Los logs completos del workflow en GitHub Actions
- La consola del navegador para ver el error exacto
- Que el repositorio `expenses-data` sea accesible con el token
