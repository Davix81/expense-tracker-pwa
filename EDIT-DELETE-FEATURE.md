# Funcionalidad de Edición y Eliminación de Gastos

## Descripción General

La aplicación ahora permite editar y eliminar gastos existentes desde la interfaz de usuario. Esta funcionalidad está disponible tanto en la vista de tabla (desktop/tablet) como en la vista de tarjetas (móvil).

## Características Implementadas

### 1. Edición de Gastos

#### Acceso
- **Vista de Tabla (Desktop/Tablet)**: Botón de icono "edit" en la columna "Accions"
- **Vista de Tarjetas (Móvil)**: Botón "Editar" con icono en las acciones de la tarjeta

#### Funcionalidad
- Abre el mismo diálogo usado para agregar gastos, pero pre-rellenado con los datos existentes
- El título del diálogo cambia a "Edita la despesa"
- El botón de acción cambia a "Actualitza despesa"
- Valida todos los campos antes de guardar
- Actualiza el gasto en GitHub y refresca la lista automáticamente

#### Campos Editables
Todos los campos del gasto son editables:
- Nom (Nombre)
- Descripció (Descripción)
- Emissor (Emisor)
- Etiqueta (Tag)
- Categoria (Categoría)
- Import aproximat (Monto aproximado)
- Data prevista de pagament (Fecha programada)
- Data real de pagament (Fecha real)
- Import real (Monto real)
- Estat del pagament (Estado)
- Banc (Banco)

### 2. Eliminación de Gastos

#### Acceso
- **Vista de Tabla (Desktop/Tablet)**: Botón de icono "delete" en la columna "Accions"
- **Vista de Tarjetas (Móvil)**: Botón "Eliminar" con icono en las acciones de la tarjeta

#### Funcionalidad
- Muestra un diálogo de confirmación antes de eliminar
- Mensaje: "Estàs segur que vols eliminar la despesa '[nombre]'?"
- Si se confirma, elimina el gasto de GitHub
- Refresca la lista automáticamente después de eliminar
- Muestra mensaje de error si falla la eliminación

## Implementación Técnica

### Servicio de Gastos (ExpenseService)

#### Método `updateExpense(expense: Expense)`
```typescript
updateExpense(expense: Expense): Observable<Expense>
```
- Valida los datos del gasto
- Busca el gasto por ID en la lista actual
- Actualiza el gasto en el array
- Persiste los cambios en GitHub
- Actualiza el estado local (BehaviorSubject)
- Retorna el gasto actualizado

#### Método `deleteExpense(expenseId: string)`
```typescript
deleteExpense(expenseId: string): Observable<boolean>
```
- Busca el gasto por ID
- Filtra el gasto del array
- Persiste los cambios en GitHub
- Actualiza el estado local
- Retorna true si tiene éxito

### Componente de Diálogo (AddExpenseDialogComponent)

#### Modo de Edición
El componente ahora acepta datos opcionales:
```typescript
constructor(@Inject(MAT_DIALOG_DATA) public data?: { expense: Expense })
```

- `isEditMode`: Boolean que indica si está en modo edición
- `expenseId`: ID del gasto a editar
- Pre-rellena el formulario con los datos existentes
- Convierte fechas de string a Date objects

#### Lógica de Envío
```typescript
onSubmit(): void {
  if (this.isEditMode && this.expenseId) {
    // Actualizar gasto existente
    this.expenseService.updateExpense(updatedExpense).subscribe(...)
  } else {
    // Agregar nuevo gasto
    this.expenseService.addExpense(expenseData).subscribe(...)
  }
}
```

### Componente de Tabla (ExpenseTableComponent)

#### Eventos de Salida
```typescript
@Output() edit = new EventEmitter<Expense>();
@Output() delete = new EventEmitter<Expense>();
```

#### Columna de Acciones
Nueva columna "actions" en la tabla con botones:
- Botón de edición (icono "edit", color primary)
- Botón de eliminación (icono "delete", color warn)

#### Acciones en Tarjetas Móviles
```html
<mat-card-actions>
  <button mat-button color="primary" (click)="onEdit(expense)">
    <mat-icon>edit</mat-icon>
    Editar
  </button>
  <button mat-button color="warn" (click)="onDelete(expense)">
    <mat-icon>delete</mat-icon>
    Eliminar
  </button>
</mat-card-actions>
```

### Componente de Lista (ExpenseListPageComponent)

#### Método `openEditDialog(expense: Expense)`
```typescript
openEditDialog(expense: Expense): void {
  const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
    width: '600px',
    disableClose: true,
    data: { expense }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadExpenses();
    }
  });
}
```

#### Método `confirmDelete(expense: Expense)`
```typescript
confirmDelete(expense: Expense): void {
  if (confirm(`Estàs segur que vols eliminar la despesa "${expense.name}"?`)) {
    this.expenseService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.loadExpenses();
      },
      error: (error) => {
        this.errorMessage = 'No s\'ha pogut eliminar la despesa...';
      }
    });
  }
}
```

## Estilos

### Botones de Acción en Tabla
```scss
// Columna de acciones con botones de icono
td mat-icon-button {
  margin: 0 4px;
}
```

### Acciones en Tarjetas Móviles
```scss
mat-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  
  button {
    mat-icon {
      margin-right: 4px;
      font-size: 18px;
    }
  }
}
```

## Flujo de Usuario

### Editar un Gasto

1. Usuario navega a la lista de gastos
2. Hace clic en el botón "Editar" (icono o texto según dispositivo)
3. Se abre el diálogo con los datos pre-rellenados
4. Usuario modifica los campos deseados
5. Hace clic en "Actualitza despesa"
6. El diálogo muestra "Actualitzant..." mientras guarda
7. Si tiene éxito, el diálogo se cierra y la lista se actualiza
8. Si falla, se muestra un mensaje de error

### Eliminar un Gasto

1. Usuario navega a la lista de gastos
2. Hace clic en el botón "Eliminar" (icono o texto según dispositivo)
3. Aparece un diálogo de confirmación nativo del navegador
4. Usuario confirma la eliminación
5. El gasto se elimina de GitHub
6. La lista se actualiza automáticamente
7. Si falla, se muestra un mensaje de error

## Validación

### Validación de Edición
- Todos los campos obligatorios deben estar completos
- Los montos deben ser números positivos
- Las fechas deben ser válidas
- El estado de pago debe ser PENDING, PAID o FAILED
- La fecha real no puede ser anterior a la fecha programada

### Manejo de Errores
- **Gasto no encontrado**: Error si el ID no existe
- **Validación fallida**: Muestra errores específicos por campo
- **Error de GitHub**: Muestra mensaje genérico de error
- **Error de red**: Capturado y mostrado al usuario

## Consideraciones de UX

### Confirmación de Eliminación
- Usa `confirm()` nativo del navegador para simplicidad
- Muestra el nombre del gasto en el mensaje
- Requiere confirmación explícita del usuario

### Feedback Visual
- Botones deshabilitados durante operaciones
- Texto de botón cambia a "Actualitzant..." o "Afegint..."
- Mensajes de error claros y en catalán
- Actualización automática de la lista después de cambios

### Accesibilidad
- Botones con `aria-label` descriptivos
- Colores semánticos (primary para editar, warn para eliminar)
- Iconos reconocibles (edit, delete)
- Texto visible en móvil para mayor claridad

## Responsive Design

### Desktop/Tablet
- Botones de icono compactos en columna de acciones
- Hover effects en botones
- Columna de acciones siempre visible

### Móvil
- Botones con texto e icono para mayor claridad
- Acciones en la parte inferior de cada tarjeta
- Separador visual (borde superior)
- Botones alineados a la derecha

## Testing

### Casos de Prueba

1. **Editar gasto existente**
   - Abrir diálogo de edición
   - Verificar que los campos están pre-rellenados
   - Modificar campos
   - Guardar y verificar actualización

2. **Eliminar gasto**
   - Hacer clic en eliminar
   - Confirmar eliminación
   - Verificar que el gasto desaparece de la lista

3. **Cancelar edición**
   - Abrir diálogo de edición
   - Modificar campos
   - Cancelar
   - Verificar que no se guardaron cambios

4. **Cancelar eliminación**
   - Hacer clic en eliminar
   - Cancelar en el diálogo de confirmación
   - Verificar que el gasto sigue en la lista

5. **Validación en edición**
   - Intentar guardar con campos vacíos
   - Verificar mensajes de error
   - Verificar que el botón está deshabilitado

6. **Manejo de errores**
   - Simular error de red
   - Verificar mensaje de error
   - Verificar que el diálogo no se cierra

## Mejoras Futuras

1. **Diálogo de confirmación personalizado**
   - Usar MatDialog en lugar de confirm() nativo
   - Mejor diseño y consistencia con Material Design

2. **Undo/Redo**
   - Permitir deshacer eliminaciones
   - Snackbar con opción "Desfer"

3. **Edición inline**
   - Editar campos directamente en la tabla
   - Guardar automáticamente al cambiar

4. **Historial de cambios**
   - Registrar quién y cuándo editó cada gasto
   - Mostrar historial de versiones

5. **Eliminación múltiple**
   - Seleccionar varios gastos
   - Eliminar en lote

6. **Confirmación con contraseña**
   - Requerir contraseña para eliminaciones
   - Mayor seguridad

## Recursos

- [Angular Material Dialog](https://material.angular.io/components/dialog/overview)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [Angular Forms](https://angular.dev/guide/forms)
