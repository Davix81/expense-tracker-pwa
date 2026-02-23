# Configuración del Token de GitHub

## Problema Actual
Error 401 al acceder a la API de GitHub desde la aplicación desplegada.

## Causa Probable
El Personal Access Token (PAT) no tiene los permisos correctos o no se está inyectando correctamente.

## Solución: Verificar y Recrear el Token

### 1. Crear un nuevo Personal Access Token

Ve a: https://github.com/settings/tokens

1. Click en "Generate new token" → "Generate new token (classic)"
2. Nombre: `expense-tracker-pwa-token`
3. Expiration: Elige la duración deseada
4. **Selecciona estos scopes (IMPORTANTE):**
   - ✅ `repo` (Full control of private repositories)
     - ✅ `repo:status`
     - ✅ `repo_deployment`
     - ✅ `public_repo`
     - ✅ `repo:invite`
     - ✅ `security_events`

5. Click en "Generate token"
6. **COPIA EL TOKEN INMEDIATAMENTE** (no podrás verlo de nuevo)

### 2. Actualizar el Secret en GitHub

1. Ve a tu repositorio: https://github.com/Davix81/expense-tracker-pwa
2. Settings → Secrets and variables → Actions
3. Busca `EXPENSES_DATA_TOKEN`
4. Click en "Update" o elimínalo y créalo de nuevo
5. Pega el nuevo token

### 3. Verificar el Repositorio de Datos

Asegúrate de que el repositorio `expenses-data` existe y es accesible:
- URL: https://github.com/Davix81/expenses-data
- Debe tener la estructura:
  ```
  expenses-data/
  └── data/
      ├── expenses.json
      └── settings.json
  ```

### 4. Verificar Permisos del Repositorio

Si `expenses-data` es privado, el token debe tener acceso a repositorios privados.
Si es público, verifica que los archivos existan en la ruta correcta.

### 5. Probar el Token Manualmente

Ejecuta este comando en tu terminal (reemplaza `YOUR_TOKEN`):

```bash
curl -H "Authorization: token YOUR_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/repos/Davix81/expenses-data/contents/data/expenses.json
```

Si funciona, verás el contenido del archivo. Si da 401, el token no tiene permisos.

### 6. Re-ejecutar el Workflow

Después de actualizar el secret:
1. Ve a Actions en tu repositorio
2. Selecciona el workflow "Deploy Angular PWA"
3. Click en "Run workflow" → "Run workflow"
4. Revisa los logs del paso "Inject GitHub Token" para confirmar que el token se inyecta

### 7. Verificar en el Build

En los logs del workflow, deberías ver:
```
✅ Token injected successfully!
Token preview: ghp_xxxxx...
Token length: 40 (o similar)
```

## Checklist de Verificación

- [ ] Token creado con scope `repo` completo
- [ ] Secret `EXPENSES_DATA_TOKEN` actualizado en GitHub Actions
- [ ] Repositorio `expenses-data` existe y es accesible
- [ ] Archivos `data/expenses.json` y `data/settings.json` existen
- [ ] Workflow ejecutado después de actualizar el secret
- [ ] Logs muestran "Token injected successfully"
- [ ] No hay errores 401 en la consola del navegador

## Notas Adicionales

- Los tokens clásicos son más confiables para este caso de uso
- Si el repositorio `expenses-data` es privado, asegúrate de que el token tenga acceso
- El token debe pertenecer a un usuario con permisos de escritura en `expenses-data`
