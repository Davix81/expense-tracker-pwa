# Guía de Diseño Responsive

## Descripción General

La aplicación Expense Tracker PWA está completamente optimizada para dispositivos móviles, tablets y escritorio. Esta guía documenta las estrategias de diseño responsive implementadas.

## Breakpoints

La aplicación utiliza los siguientes breakpoints:

| Breakpoint | Rango | Dispositivo | Estrategia |
|------------|-------|-------------|------------|
| Small Mobile | < 480px | Teléfonos pequeños | Vista ultra compacta |
| Mobile | 480px - 767px | Teléfonos | Vista de tarjetas |
| Tablet | 768px - 1023px | Tablets | Tabla con scroll horizontal |
| Desktop | 1024px - 1439px | Escritorio | Tabla completa |
| Large Desktop | ≥ 1440px | Pantallas grandes | Tabla expandida |

## Componentes Responsive

### 1. Header / Toolbar

#### Desktop (> 1024px)
- Título completo: "Gestor de Despeses"
- Botones con texto e iconos
- Altura: 64px

#### Tablet (768px - 1023px)
- Título completo
- Botones con texto e iconos (tamaño reducido)
- Altura: 64px

#### Mobile (< 768px)
- Título reducido (16px)
- Solo iconos en botones (sin texto)
- Altura: 56px
- Padding reducido

#### Small Mobile (< 480px)
- Título truncado con ellipsis
- Iconos más pequeños
- Padding mínimo

### 2. Tabla de Gastos

#### Desktop (> 1024px)
**Vista:** Tabla completa

- Todas las columnas visibles
- Ancho mínimo: 1200px
- Hover effects en filas
- Padding: 12px 16px
- Font size: 14px

#### Tablet (768px - 1023px)
**Vista:** Tabla con scroll horizontal

- Todas las columnas visibles
- Scroll horizontal habilitado
- Ancho mínimo: 1100px
- Padding: 10px 12px
- Font size: 13px

#### Mobile (< 768px)
**Vista:** Tarjetas (Cards)

- Tabla oculta completamente
- Vista de tarjetas apiladas verticalmente
- Cada gasto en una tarjeta Material
- Información organizada en filas clave-valor
- Sin scroll horizontal necesario

**Estructura de tarjeta:**
```
┌─────────────────────────┐
│ Nombre del Gasto        │
│ Categoría               │
├─────────────────────────┤
│ Descripció: [valor]     │
│ Emissor: [valor]        │
│ Etiqueta: [valor]       │
│ Import aproximat: [€]   │
│ Data prevista: [fecha]  │
│ Data real: [fecha]      │
│ Import real: [€]        │
│ Banc: [valor]           │
│ ─────────────────       │
│ Estat: [CHIP]           │
└─────────────────────────┘
```

### 3. Dashboard

#### Desktop (> 1024px)
- Grid de 3 columnas para gráficos
- Tarjeta de próximo pago a ancho completo
- Gráficos: 300px de altura
- Padding: 24px

#### Tablet (768px - 1023px)
- Grid de 2 columnas para gráficos
- Gráficos: 280px de altura
- Padding: 20px 16px

#### Mobile (< 768px)
- Grid de 1 columna (apilado)
- Gráficos: 250px de altura
- Botón mini-fab en lugar de raised button
- Padding: 16px 12px
- Título reducido: 20px

#### Small Mobile (< 480px)
- Gráficos: 220px de altura
- Padding: 12px 8px
- Título: 18px
- Contador de próximo pago más compacto

### 4. Floating Action Button (FAB)

#### Desktop (> 1024px)
- Posición: bottom 24px, right 24px
- Tamaño: 56x56px
- Icono: 24px

#### Tablet (768px - 1023px)
- Posición: bottom 20px, right 20px
- Tamaño: 56x56px

#### Mobile (< 768px)
- Posición: bottom 16px, right 16px
- Tamaño: 56x56px
- Icono: 24px

#### Small Mobile (< 480px)
- Posición: bottom 12px, right 12px
- Tamaño: 48x48px
- Icono: 20px

## Estrategias de Diseño

### Mobile-First Approach

Aunque el código muestra primero los estilos desktop, la aplicación está diseñada pensando en móviles:

1. **Contenido prioritario**: Información más importante siempre visible
2. **Touch-friendly**: Botones y áreas táctiles de mínimo 44x44px
3. **Scroll vertical**: Preferido sobre scroll horizontal
4. **Tarjetas**: Mejor legibilidad que tablas en pantallas pequeñas

### Progressive Enhancement

- **Mobile**: Funcionalidad básica con tarjetas
- **Tablet**: Tabla con scroll horizontal
- **Desktop**: Tabla completa con hover effects

### Optimizaciones de Performance

#### Mobile
- Imágenes y gráficos optimizados
- Lazy loading cuando sea posible
- Animaciones reducidas
- Menor uso de sombras y efectos

#### Desktop
- Efectos hover
- Transiciones suaves
- Sombras más pronunciadas

## Componentes Material Design

### Adaptaciones Mobile

**MatToolbar**
- Altura reducida en mobile (56px vs 64px)
- Padding ajustado
- Botones icon-only

**MatCard**
- Padding reducido en mobile
- Sombras más sutiles
- Bordes redondeados

**MatChip**
- Tamaño reducido en mobile (11px vs 12px)
- Padding ajustado (3px 10px vs 4px 12px)

**MatFormField**
- Ancho completo en mobile
- Font size reducido

## Testing Responsive

### Herramientas Recomendadas

1. **Chrome DevTools**
   - Device Toolbar (Ctrl+Shift+M)
   - Responsive mode
   - Emulación de dispositivos

2. **Dispositivos Reales**
   - iPhone (Safari)
   - Android (Chrome)
   - iPad (Safari)

3. **Lighthouse**
   - Mobile performance
   - Accessibility
   - PWA score

### Checklist de Testing

- [ ] Navegación funciona en todos los breakpoints
- [ ] Texto legible sin zoom
- [ ] Botones táctiles (mínimo 44x44px)
- [ ] Sin scroll horizontal no deseado
- [ ] Imágenes y gráficos se adaptan
- [ ] Formularios usables en mobile
- [ ] FAB no obstruye contenido
- [ ] Orientación portrait y landscape

## Mejores Prácticas

### CSS

```scss
// ✅ Correcto: Mobile-first
.element {
  // Estilos base (mobile)
  padding: 8px;
  
  @media (min-width: 768px) {
    // Tablet
    padding: 16px;
  }
  
  @media (min-width: 1024px) {
    // Desktop
    padding: 24px;
  }
}

// ❌ Incorrecto: Desktop-first
.element {
  padding: 24px;
  
  @media (max-width: 1024px) {
    padding: 16px;
  }
}
```

### HTML

```html
<!-- ✅ Correcto: Contenido semántico -->
<mat-card class="expense-card">
  <mat-card-header>
    <mat-card-title>{{ expense.name }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <!-- Contenido -->
  </mat-card-content>
</mat-card>

<!-- ❌ Incorrecto: Divs genéricos -->
<div class="card">
  <div class="title">{{ expense.name }}</div>
  <div class="content">
    <!-- Contenido -->
  </div>
</div>
```

### Accesibilidad

- Usar `aria-label` en botones icon-only
- Mantener contraste de color adecuado
- Tamaños de fuente legibles (mínimo 14px en mobile)
- Touch targets de mínimo 44x44px

## Futuras Mejoras

1. **Gestos táctiles**
   - Swipe para eliminar gastos
   - Pull-to-refresh
   - Pinch-to-zoom en gráficos

2. **Orientación landscape**
   - Layout optimizado para landscape en tablets
   - Gráficos más anchos

3. **Dark mode**
   - Tema oscuro para reducir fatiga visual
   - Detección automática de preferencia del sistema

4. **Animaciones**
   - Transiciones entre vistas
   - Loading skeletons
   - Micro-interacciones

## Recursos

- [Material Design Responsive Layout](https://material.io/design/layout/responsive-layout-grid.html)
- [Angular Material Breakpoints](https://material.angular.io/cdk/layout/overview)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive](https://web.dev/responsive-web-design-basics/)
