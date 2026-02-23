# 🔴 PROBLEMA IDENTIFICADO: Token Expuesto en Build

## El Problema

GitHub está detectando y revocando tu token porque encuentra el string `__GITHUB_TOKEN__` en los archivos JavaScript compilados que se suben a la rama `gh-pages`.

### Evidencia

En el archivo `dist/expense-tracker-pwa/browser/main-6MFHB5BZ.js` se encuentra:

```javascript
Ko={production:!0,auth:{username:"admin",password:"123"},github:{token:"__GITHUB_TOKEN__",owner:"Davix81",repo:"expenses-data",branch:"main",filePath:"data/expenses.json",settingsFilePath:"data/settings.json"}}
```

Esto significa que el placeholder NO se estaba reemplazando antes del build.

## Causa Raíz

El workflow anterior intentaba modificar `environment.prod.ts` ANTES del build, pero:

1. Angular usa cache agresivo (`.angular/cache`)
2. El archivo modificado no siempre se recompilaba
3. El placeholder llegaba al código compilado
4. GitHub lo detectaba como un posible token expuesto

## ✅ Solución Implementada

### Nuevo Enfoque: Inyección POST-BUILD

En lugar de modificar el código fuente antes de compilar, ahora:

1. ✅ **Build** - Compila la aplicación con el placeholder
2. ✅ **Inject Token** - Reemplaza el placeholder directamente en los archivos `.js` compilados
3. ✅ **Verify** - El script verifica que no queden placeholders
4. ✅ **Deploy** - Sube el código con el token real

### Archivos Modificados

1. **`scripts/inject-token-post-build.js`** (NUEVO)
   - Busca recursivamente todos los archivos `.js` en `dist/`
   - Reemplaza todas las ocurrencias de `__GITHUB_TOKEN__`
   - Verifica que el reemplazo fue exitoso
   - Falla si encuentra problemas

2. **`.github/workflows/deploy.yml`** (ACTUALIZADO)
   - Eliminado el paso de inyección pre-build
   - Agregado el paso de inyección post-build
   - El token se inyecta DESPUÉS de compilar

3. **`scripts/inject-token.js`** (OBSOLETO)
   - Ya no se usa en el workflow
   - Se mantiene por compatibilidad

## Ventajas de este Enfoque

✅ **No depende del cache de Angular** - Modifica archivos ya compilados
✅ **Verificación automática** - Falla si el placeholder no se reemplaza
✅ **Sin dependencias externas** - Solo usa módulos nativos de Node.js
✅ **Más confiable** - El token siempre se inyecta correctamente

## Próximos Pasos

1. **Crear un nuevo token** en GitHub (el anterior fue revocado)
2. **Actualizar el secret** `EXPENSES_DATA_TOKEN`
3. **Hacer push** de estos cambios
4. **Verificar el workflow** - Debe mostrar "Token injection completed successfully"
5. **Verificar la app** - No debe haber errores 401

## Verificación

Después del deploy, puedes verificar que el token NO está expuesto:

```bash
# Descargar el archivo JavaScript principal de gh-pages
curl https://davix81.github.io/expense-tracker-pwa/main-XXXXX.js | grep -o "__GITHUB_TOKEN__"
```

Si no devuelve nada, el token se inyectó correctamente.
