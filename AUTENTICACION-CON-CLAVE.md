# 🔐 Autenticación con Clave de Encriptación

## Cambios Implementados

Se ha eliminado el sistema de usuario/contraseña hardcodeado y ahora la aplicación usa directamente la clave de encriptación como método de autenticación.

## Cómo Funciona

### Antes
- Usuario: `admin`
- Contraseña: `123`
- Clave de encriptación: almacenada en `STORAGE_CONFIG` (GitHub Secret)
- Settings se cargaban al inicio de la app

### Ahora
- Solo se pide la **clave de encriptación** al iniciar sesión
- La clave se almacena en `sessionStorage` (se borra al cerrar el navegador)
- La misma clave se usa para encriptar/desencriptar los datos
- Settings y expenses se cargan DESPUÉS del login exitoso

## Ventajas de Seguridad

1. **Sin credenciales en el código**: No hay usuario/contraseña hardcodeados
2. **Clave única por usuario**: Cada usuario tiene su propia clave de encriptación
3. **Sesión temporal**: La clave solo existe durante la sesión del navegador
4. **Validación real**: Si la clave es incorrecta, no se pueden desencriptar los datos
5. **Carga diferida**: Los datos solo se cargan cuando hay una clave válida

## Flujo de Autenticación

1. Usuario abre la app → Redirige a `/login`
2. Usuario ingresa su clave de encriptación
3. Sistema valida que la clave tenga mínimo 8 caracteres
4. Sistema guarda la clave en `sessionStorage`
5. Sistema carga los settings desde la API
6. Si los settings se cargan correctamente → Redirige a `/dashboard`
7. Dashboard carga los expenses usando la misma clave

## Uso

### 1. Generar tu Clave de Encriptación

Si aún no tienes una clave, genera una nueva:

```bash
cd expense-tracker-pwa
node scripts/generate-storage-config.js
```

Esto creará un archivo `.storage-config` con tu clave. **Guarda esta clave en un lugar seguro**.

### 2. Iniciar Sesión

1. Abre la aplicación
2. Ingresa tu clave de encriptación (mínimo 8 caracteres)
3. Click en "Accedir"
4. La app cargará tus settings y te llevará al dashboard

### 3. Configurar GitHub Actions

Ya NO necesitas el secret `STORAGE_CONFIG` en GitHub Actions. Solo necesitas:

- `API_URL`: URL de tu backend en Vercel
- `API_SECRET`: Secret para autenticar con el backend

Para eliminar el secret `STORAGE_CONFIG`:
1. Ve a: https://github.com/[tu-usuario]/expense-tracker-pwa/settings/secrets/actions
2. Elimina el secret `STORAGE_CONFIG` (ya no se usa)

## Archivos Modificados

### Servicios
- `auth.service.ts`: Ahora almacena la clave de encriptación en sessionStorage
- `api-storage.service.ts`: Obtiene la clave del AuthService
- `github-storage.service.ts`: Obtiene la clave del AuthService

### Componentes
- `login-page.component.ts`: Solo pide la clave de encriptación y carga settings después del login
- `login-page.component.html`: UI simplificada con un solo campo
- `app.ts`: Ya NO carga settings al inicio (evita errores antes del login)

### Configuración
- `environment.ts`: Sin credenciales hardcodeadas
- `environment.prod.ts`: Sin credenciales hardcodeadas
- `inject-storage-config.js`: Ya no inyecta STORAGE_CONFIG
- `.github/workflows/deploy.yml`: Ya no requiere STORAGE_CONFIG

## Migración

Si ya tienes datos encriptados con la clave anterior:

1. Tu clave de encriptación sigue siendo la misma
2. Simplemente úsala para iniciar sesión
3. Los datos se desencriptarán correctamente

## Recuperación de Clave

⚠️ **IMPORTANTE**: Si pierdes tu clave de encriptación:
- No podrás acceder a tus datos encriptados
- No hay forma de recuperar la clave
- Tendrás que empezar con datos nuevos

**Recomendación**: Guarda tu clave en un gestor de contraseñas seguro.

## Preguntas Frecuentes

### ¿Es seguro?
Sí, más seguro que antes porque:
- No hay credenciales en el código fuente
- La clave solo existe en tu navegador durante la sesión
- Nadie puede acceder a tus datos sin tu clave
- Los datos no se cargan hasta que hay una clave válida

### ¿Puedo compartir la aplicación?
Sí, pero cada usuario necesita su propia clave de encriptación para sus propios datos.

### ¿Qué pasa si cierro el navegador?
Tendrás que volver a ingresar tu clave de encriptación.

### ¿Puedo cambiar mi clave?
Sí, pero tendrías que:
1. Desencriptar todos los datos con la clave antigua
2. Encriptarlos con la clave nueva
3. Subir los datos re-encriptados

(Esto requeriría un script adicional)
