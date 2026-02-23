# ⚡ Solución Simple: GitHub Actions como API

## Concepto

Usar GitHub Actions con `workflow_dispatch` para crear endpoints que el frontend puede llamar.

## Ventajas

✅ **Sin backend adicional** - Todo en GitHub
✅ **Gratis** - Incluido en GitHub
✅ **Token seguro** - Usa GITHUB_TOKEN automático
✅ **Simple** - No requiere infraestructura adicional

## Limitaciones

⚠️ **No es tiempo real** - Hay un delay de ~30 segundos
⚠️ **Rate limits** - Limitado por GitHub Actions
⚠️ **No es ideal para producción** - Mejor para prototipos

## Alternativa MÁS SIMPLE: Repositorio Público

La solución más rápida y práctica:

### Paso 1: Hacer el Repositorio Público

```bash
# En GitHub:
# 1. Ve a https://github.com/Davix81/expenses-data
# 2. Settings → Danger Zone → Change visibility → Make public
```

### Paso 2: Eliminar Autenticación

`src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  auth: {
    username: 'admin',
    password: '123'
  },
  github: {
    token: '', // Vacío para repos públicos
    owner: 'Davix81',
    repo: 'expenses-data',
    branch: 'main',
    filePath: 'data/expenses.json',
    settingsFilePath: 'data/settings.json'
  }
};
```

### Paso 3: Actualizar Servicio

Modificar `github-storage.service.ts` para no enviar token si está vacío:

```typescript
private buildHeaders(): HttpHeaders {
  const headers: any = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
  
  // Solo agregar Authorization si hay token
  if (this.config.token) {
    headers['Authorization'] = `token ${this.config.token}`;
  }
  
  return new HttpHeaders(headers);
}
```

### Paso 4: Proteger con Autenticación de App

Aunque el repositorio sea público, tu app tiene autenticación:

```typescript
// Solo usuarios autenticados pueden acceder
auth: {
  username: 'admin',
  password: 'tu-password-seguro'
}
```

## Comparación de Soluciones

| Solución | Seguridad | Complejidad | Costo | Tiempo Real |
|----------|-----------|-------------|-------|-------------|
| **Repo Público** | ⭐⭐ | ⭐ | Gratis | ✅ |
| **Backend Vercel** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Gratis | ✅ |
| **GitHub Actions API** | ⭐⭐⭐ | ⭐⭐⭐⭐ | Gratis | ❌ |
| **PAT en Frontend** | ❌ | ⭐ | Gratis | ✅ |

## Recomendación

### Para Uso Personal (Datos No Sensibles)
→ **Repositorio Público** + Autenticación de App

### Para Datos Sensibles
→ **Backend Vercel** (ver IMPLEMENTACION-BACKEND-VERCEL.md)

### Para Prototipo Rápido
→ **Repositorio Público**

## Implementación Rápida: Repo Público

¿Quieres que implemente la solución de repositorio público? Es la más rápida:

1. Modificar el servicio para soportar repos públicos
2. Actualizar environment para no usar token
3. Simplificar el workflow (no necesita inyección de token)
4. Instrucciones para hacer el repo público

Esta solución te permite tener la app funcionando en 5 minutos.
