# NotificationMessageComponent

Componente reutilizable para mostrar mensajes de notificación con estilos consistentes en toda la aplicación.

## Características

- Soporte para 4 tipos de mensajes: `success`, `error`, `warning`, `info`
- Iconos automáticos según el tipo de mensaje
- Animación de entrada suave
- Diseño responsive
- Estilos consistentes con Material Design

## Uso

### Importación

```typescript
import { NotificationMessageComponent, NotificationType } from '../notification-message/notification-message.component';

@Component({
  // ...
  imports: [
    // ...
    NotificationMessageComponent
  ]
})
```

### En el template

```html
<app-notification-message 
  [message]="errorMessage" 
  [type]="'error'" 
  [show]="showErrorMessage">
</app-notification-message>
```

### En el componente TypeScript

```typescript
export class MyComponent {
  errorMessage: string = '';
  showErrorMessage: boolean = false;

  showError(message: string) {
    this.errorMessage = message;
    this.showErrorMessage = true;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }
}
```

## Propiedades

| Propiedad | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `message` | `string` | Sí | `''` | El mensaje a mostrar |
| `type` | `NotificationType` | No | `'info'` | Tipo de notificación: `'success'`, `'error'`, `'warning'`, `'info'` |
| `show` | `boolean` | Sí | `false` | Controla la visibilidad del mensaje |

## Tipos de Notificación

### Success
- Color: Verde
- Icono: check_circle
- Uso: Operaciones completadas exitosamente

### Error
- Color: Rojo
- Icono: error
- Uso: Errores y fallos en operaciones

### Warning
- Color: Naranja
- Icono: warning
- Uso: Advertencias y situaciones que requieren atención

### Info
- Color: Azul
- Icono: info
- Uso: Información general y mensajes informativos

## Ejemplos de Uso

### Mensaje de éxito al guardar

```typescript
saveData() {
  this.service.save(data).subscribe({
    next: () => {
      this.message = 'Datos guardados correctamente';
      this.messageType = 'success';
      this.showMessage = true;
      setTimeout(() => this.showMessage = false, 5000);
    }
  });
}
```

### Mensaje de error

```typescript
loadData() {
  this.service.load().subscribe({
    error: (error) => {
      this.message = error.message || 'Error al cargar los datos';
      this.messageType = 'error';
      this.showMessage = true;
      setTimeout(() => this.showMessage = false, 5000);
    }
  });
}
```

### Mensaje de advertencia

```typescript
checkStatus() {
  if (this.hasWarnings) {
    this.message = 'Algunos campos requieren atención';
    this.messageType = 'warning';
    this.showMessage = true;
  }
}
```

## Estilos

El componente utiliza las variables de estilo globales de la aplicación y es completamente responsive. Los estilos se adaptan automáticamente a dispositivos móviles.

## Reemplazo de Componentes Antiguos

Este componente reemplaza los siguientes patrones antiguos:

- `MatSnackBar` para notificaciones
- Divs personalizados con clases `.error-message`, `.success-message`, etc.
- Mensajes inline con estilos inconsistentes

## Migración

Para migrar código existente:

1. Reemplazar `MatSnackBar.open()` con el componente
2. Cambiar divs de error/éxito personalizados por `<app-notification-message>`
3. Actualizar las propiedades del componente para usar `message`, `type`, y `show`
