# 🔓 Hacer el Repositorio Público

## Por Qué es Seguro Ahora

Con la encriptación implementada, tus datos están protegidos incluso en un repositorio público:
- Los archivos JSON están encriptados con AES-256
- Solo tú tienes la clave de encriptación (`STORAGE_CONFIG`)
- Nadie puede leer los datos sin la clave

## Pasos para Hacer el Repositorio Público

### 1. Ve al Repositorio

Abre: https://github.com/Davix81/expenses-data

### 2. Accede a Settings

Click en "Settings" (en la barra superior del repositorio)

### 3. Cambia la Visibilidad

1. Scroll hasta el final de la página
2. Busca la sección "Danger Zone"
3. Click en "Change visibility"
4. Selecciona "Make public"
5. Confirma escribiendo el nombre del repositorio: `Davix81/expenses-data`
6. Click en "I understand, make this repository public"

### 4. Verifica

Después de hacer el repositorio público:
1. Recarga tu aplicación: https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. Deberías poder ver los expenses sin error 401

## ⚠️ Importante

Antes de hacer el repositorio público, asegúrate de que:

1. ✅ Has generado la configuración de almacenamiento
   ```bash
   node scripts/generate-storage-config.js
   ```

2. ✅ Has configurado el secret `STORAGE_CONFIG` en GitHub Actions
   - https://github.com/Davix81/expense-tracker-pwa/settings/secrets/actions

3. ✅ Has hecho deploy de la aplicación con encriptación
   ```bash
   git push origin master
   ```

4. ✅ Los datos están encriptados (verifica en GitHub que no son JSON legible)

## Si los Datos NO Están Encriptados Todavía

Si tus datos actuales están en plain JSON:

1. **NO hagas el repositorio público todavía**
2. Primero completa la configuración de encriptación
3. Haz deploy
4. Abre la app y guarda cualquier cambio (esto encriptará los datos)
5. Verifica en GitHub que los datos están encriptados
6. Entonces sí, haz el repositorio público

## Verificar que los Datos Están Encriptados

1. Ve a: https://github.com/Davix81/expenses-data/blob/main/data/expenses.json
2. Si ves algo como esto, están encriptados:
   ```
   a8f3d9e2b7c4e1f8...
   ```
3. Si ves JSON legible como esto, NO están encriptados:
   ```json
   [
     {
       "id": "123",
       "amount": 100
     }
   ]
   ```

## Alternativa: Mantener el Repositorio Privado

Si prefieres mantener el repositorio privado, necesitas usar un Personal Access Token (pero GitHub lo revocará si lo detecta en el código).

Ver: `SOLUCION-ALTERNATIVA-SEGURA.md` para opciones con backend.
