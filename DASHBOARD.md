# Dashboard - Documentación

## Descripción General

El Dashboard es la pantalla principal de la aplicación después del login. Proporciona una vista visual y analítica de los gastos mediante gráficos interactivos y métricas clave.

## Características

### 1. Contador de Próximo Pago

Muestra información sobre el próximo pago pendiente:

- **Nombre del gasto**: Identificación clara del próximo pago
- **Monto aproximado**: Cantidad esperada a pagar
- **Fecha programada**: Cuándo está programado el pago
- **Contador de días**: Días restantes hasta el pago

El contador solo muestra gastos con estado `PENDING` y fecha futura. Si no hay pagos pendientes, muestra un mensaje indicándolo.

### 2. Gráfico de Gastos Mensuales

Gráfico de barras que muestra:

- **Período**: Últimos 6 meses
- **Datos**: Total de gastos pagados por mes
- **Formato**: Barras verticales con valores en euros (€)
- **Interactividad**: Hover para ver valores exactos

Solo incluye gastos con estado `PAID` y que tienen `actualAmount` registrado.

### 3. Gráfico de Tendencia Anual

Gráfico de líneas que muestra:

- **Período**: Últimos 12 meses
- **Datos**: Evolución de gastos a lo largo del año
- **Formato**: Línea continua con área sombreada
- **Utilidad**: Identificar patrones y tendencias de gasto

Permite visualizar si los gastos están aumentando, disminuyendo o se mantienen estables.

### 4. Gráfico por Categoría

Gráfico de dona (doughnut) que muestra:

- **Datos**: Distribución de gastos por categoría
- **Formato**: Segmentos de colores con leyenda
- **Utilidad**: Identificar en qué categorías se gasta más

Cada categoría tiene un color único para fácil identificación.

## Tecnologías Utilizadas

### Chart.js

Librería de gráficos JavaScript utilizada para renderizar todos los gráficos:

- **Versión**: Compatible con Angular 17+
- **Wrapper**: ng2-charts para integración con Angular
- **Tipos de gráficos**: Bar, Line, Doughnut

### Angular Signals

Utilizado para gestión reactiva del estado:

- `expenses`: Lista de gastos
- `nextPayment`: Próximo pago pendiente
- `daysUntilNextPayment`: Días hasta el próximo pago
- `monthlyChartData`: Datos del gráfico mensual
- `yearlyChartData`: Datos del gráfico anual
- `categoryChartData`: Datos del gráfico por categoría

## Cálculos y Lógica

### Próximo Pago

```typescript
1. Filtrar gastos con estado PENDING
2. Filtrar gastos con fecha >= fecha actual
3. Ordenar por fecha ascendente
4. Tomar el primero
5. Calcular diferencia en días
```

### Gastos Mensuales

```typescript
1. Crear mapa de últimos N meses
2. Filtrar gastos PAID con actualPaymentDate y actualAmount
3. Agrupar por mes/año
4. Sumar actualAmount por mes
5. Generar array ordenado cronológicamente
```

### Gastos por Categoría

```typescript
1. Filtrar gastos PAID con actualAmount
2. Agrupar por categoría
3. Sumar actualAmount por categoría
4. Generar array de labels y valores
```

## Navegación

### Desde Dashboard

- **Ver Lista Completa**: Navega a `/expenses` para ver la tabla detallada de gastos

### Hacia Dashboard

- **Desde Login**: Redirección automática después de login exitoso
- **Desde Lista de Gastos**: Botón "Dashboard" en el header

## Responsive Design

El dashboard está optimizado para diferentes tamaños de pantalla:

### Desktop (>768px)

- Grid de 3 columnas para los gráficos
- Tarjeta de próximo pago a ancho completo
- Gráficos con altura de 300px

### Mobile (<768px)

- Grid de 1 columna (gráficos apilados)
- Tamaños de fuente reducidos
- Contador de próximo pago adaptado

## Estilos

### Tarjeta de Próximo Pago

- Gradiente morado/azul de fondo
- Texto blanco para contraste
- Contador destacado con fondo semi-transparente
- Efecto blur para modernidad

### Gráficos

- Tarjetas Material Design
- Altura fija de 300px
- Responsive y adaptable
- Colores consistentes con el tema

## Mejoras Futuras

Posibles mejoras para el dashboard:

1. **Filtros de fecha**: Permitir seleccionar rango de fechas personalizado
2. **Comparación**: Comparar mes actual vs mes anterior
3. **Exportación**: Exportar gráficos como imágenes
4. **Más métricas**: Total gastado, promedio mensual, etc.
5. **Predicciones**: Proyecciones de gastos futuros
6. **Alertas**: Notificaciones de pagos próximos
7. **Gráfico de tendencia por categoría**: Ver evolución de cada categoría

## Mantenimiento

### Actualizar Chart.js

```bash
npm update chart.js ng2-charts
```

### Agregar nuevo tipo de gráfico

1. Importar tipo de gráfico en el componente
2. Crear signal para los datos
3. Definir opciones del gráfico
4. Agregar canvas en el template
5. Implementar lógica de cálculo de datos

### Modificar colores

Los colores están definidos en:

- `backgroundColor`: Array de colores RGBA
- `borderColor`: Color del borde
- Modificar en cada dataset según necesidad
