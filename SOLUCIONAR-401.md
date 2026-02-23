# 🔧 Solucionar Error 401: Bad Credentials

## El Problema

Obtienes error 401 porque:
- El repositorio `expenses-data` es **privado**
- La app no tiene token configurado (está vacío)
- GitHub requiere autenticación para repos privados

## Soluciones

### ✅ Opción 1: Hacer el Repositorio Público (RECOMENDADO)

**Cuándo usar:** Tienes encriptación configurada o no tienes datos sensibles.

**Pasos rápidos:**
1. Ve a: https://github.com/Davix81/expenses-data/settings
2. Danger Zone → Change visibility → Make public
3. Confirma
4. Recarga la app

**Seguridad:** Con encriptación, tus datos están protegidos incluso en repo público.

**Documentación:** Ver `HACER-REPO-PUBLICO.md`

---

### ✅ Opción 2: Encriptar Datos Primero, Luego Hacer Público

**Cuándo usar:** Tienes datos en plain JSON que necesitas proteger.

**Pasos rápidos:**
1. Genera configuración: `node scripts/generate-storage-config.js`
2. Configura secret `STORAGE_CONFIG` en GitHub Actions
3. Usa token temporal para encriptar datos existentes
4. Haz el repositorio público
5. Deploy

**Documentación:** Ver `ENCRIPTAR-DATOS-EXISTENTES.md`

---

### ⚠️ Opción 3: Mantener Privado con Token (NO RECOMENDADO)

**Cuándo usar:** Solo si absolutamente necesitas el repo privado.

**Problema:** GitHub detectará y revocará el token.

**Alternativa:** Implementar backend proxy (ver `IMPLEMENTACION-BACKEND-VERCEL.md`)

---

## Recomendación

**Para tu caso:**

1. **Si NO tienes datos importantes todavía:**
   - Haz el repositorio público ahora
   - Crea archivos vacíos si no existen
   - La app los encriptará automáticamente

2. **Si tienes datos importantes:**
   - Sigue la Opción 2 (encriptar primero)
   - Luego haz el repositorio público

## Verificación Rápida

### ¿Tienes datos importantes en expenses-data?

**NO** → Opción 1 (hacer público directamente)
**SÍ** → Opción 2 (encriptar primero)

### ¿Están los datos encriptados?

Verifica en: https://github.com/Davix81/expenses-data/blob/main/data/expenses.json

**Si ves JSON legible:**
```json
[{"id": "123", "amount": 100}]
```
→ NO están encriptados, usa Opción 2

**Si ves texto encriptado:**
```
a8f3d9e2b7c4e1f8...
```
→ SÍ están encriptados, usa Opción 1

## Comando Rápido

Para hacer el repositorio público desde la terminal (requiere GitHub CLI):

```bash
gh repo edit Davix81/expenses-data --visibility public
```

O manualmente: https://github.com/Davix81/expenses-data/settings

## Después de Hacer Público

1. Recarga la app: https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. No más error 401
4. Los datos se desencriptan automáticamente con tu `STORAGE_CONFIG`

## ¿Necesitas Ayuda?

- **Hacer público:** `HACER-REPO-PUBLICO.md`
- **Encriptar datos:** `ENCRIPTAR-DATOS-EXISTENTES.md`
- **Backend alternativo:** `IMPLEMENTACION-BACKEND-VERCEL.md`
