# ⚡ Inicio Rápido: Encriptación en 5 Minutos

## Comandos a Ejecutar

```bash
# 1. Generar clave de encriptación
node scripts/generate-encryption-key.js

# 2. Copiar la clave generada (64 caracteres)

# 3. Agregar como secret en GitHub
# Ve a: https://github.com/Davix81/expense-tracker-pwa/settings/secrets/actions
# Name: ENCRYPTION_KEY
# Secret: [pega la clave]

# 4. Hacer el repositorio público
# Ve a: https://github.com/Davix81/expenses-data/settings
# Change visibility → Make public

# 5. Deploy
git add .
git commit -m "feat: encriptación AES-256"
git push origin master
```

## ¿Qué Hace Esto?

1. **Genera una clave** de 64 caracteres para encriptar tus datos
2. **Configura el secret** en GitHub Actions para inyectar la clave
3. **Hace público** el repositorio de datos (pero encriptados)
4. **Despliega** la app con encriptación activada

## Resultado

- ✅ Datos encriptados en GitHub
- ✅ Sin Personal Access Token
- ✅ Repositorio público pero datos privados
- ✅ GitHub no revoca nada

## Verificar

1. Abre: https://davix81.github.io/expense-tracker-pwa/
2. Inicia sesión
3. Verifica que funciona
4. Ve a GitHub y verifica que los datos están encriptados

## Documentación Completa

- **RESUMEN-ENCRIPTACION.md** - Resumen ejecutivo
- **GUIA-ENCRIPTACION.md** - Guía detallada

## ⚠️ Importante

**GUARDA LA CLAVE DE ENCRIPTACIÓN** en un lugar seguro. Si la pierdes, no podrás recuperar tus datos.

---

¿Listo? Ejecuta el primer comando: `node scripts/generate-encryption-key.js`
