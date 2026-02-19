# Formato de Moneda en la Aplicación

## Configuración

La aplicación utiliza **EUR (Euro)** como moneda predeterminada en toda la aplicación.

## Formato del Pipe Currency

Se utiliza el pipe `currency` de Angular con los siguientes parámetros:

```typescript
{{ amount | currency:'EUR':'symbol':'1.2-2':'es' }}
```

### Parámetros:

1. **'EUR'**: Código de moneda ISO 4217 para Euro
2. **'symbol'**: Muestra el símbolo de moneda (€) en lugar del código
3. **'1.2-2'**: Formato de dígitos
   - `1`: Mínimo 1 dígito antes del punto decimal
   - `2-2`: Mínimo 2 y máximo 2 dígitos después del punto decimal
4. **'es'**: Locale español (usa el locale configurado en app.config.ts)

## Ejemplos de Formato

| Valor | Formato Mostrado |
|-------|------------------|
| 100 | 100,00 € |
| 1234.56 | 1.234,56 € |
| 0.5 | 0,50 € |
| 1000000 | 1.000.000,00 € |

## Locale Configurado

La aplicación está configurada con el locale **es-ES** (Español de España) en `app.config.ts`:

```typescript
{ provide: LOCALE_ID, useValue: 'es-ES' }
```

Este locale determina:
- Separador de miles: punto (.)
- Separador decimal: coma (,)
- Símbolo de moneda: € (después del número)
- Formato de fecha: DD/MM/YYYY

## Ubicaciones donde se Muestra la Moneda

### Dashboard
- Próximo pago
- Total pagado este año
- Total pagado este mes
- Total pendiente
- Promedio mensual

### Tabla de Gastos
- Import aproximat (columna y tarjeta móvil)
- Import real (columna y tarjeta móvil)

### Formulario de Gastos
- Campo de import aproximat (prefijo €)
- Campo de import real (prefijo €)

## Cambiar la Moneda

Para cambiar a otra moneda:

1. Actualizar todos los pipes `currency` en los templates HTML
2. Cambiar el código de moneda de 'EUR' al deseado (ej: 'USD', 'GBP')
3. Opcionalmente, actualizar el locale en `app.config.ts` si es necesario

Ejemplo para USD:
```typescript
{{ amount | currency:'USD':'symbol':'1.2-2':'en-US' }}
```
