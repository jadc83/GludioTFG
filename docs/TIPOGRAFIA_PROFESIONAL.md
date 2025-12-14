# 🎨 Tipografía Profesional - Sistema de Fuentes

## 🎯 Objetivo

Implementar un sistema tipográfico profesional, elegante y uniforme en toda la aplicación usando **Inter** para texto general y **JetBrains Mono** para contenido técnico (números, códigos, fechas).

---

## ✅ **FUENTES IMPLEMENTADAS**

### 1️⃣ **Inter** - Fuente Principal
**Uso:** Texto general, títulos, botones, navegación

**Características:**
- ✅ Diseñada específicamente para interfaces digitales
- ✅ Excelente legibilidad en pantallas
- ✅ Variable font con múltiples pesos (300-800)
- ✅ Usada por: GitHub, Mozilla, Figma, Vercel

**Pesos disponibles:**
- 300 (Light)
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)
- 800 (Extrabold)

---

### 2️⃣ **JetBrains Mono** - Fuente Monoespaciada
**Uso:** Números, precios, fechas, localizadores, documentos

**Características:**
- ✅ Diseñada para código pero perfecta para números
- ✅ Diferenciación clara entre caracteres (0/O, 1/l/I)
- ✅ Ligaduras opcionales
- ✅ Excelente para datos tabulares

**Pesos disponibles:**
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)

---

## 📋 **CONFIGURACIÓN**

### **tailwind.config.js**
```javascript
theme: {
    extend: {
        fontFamily: {
            sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', ...defaultTheme.fontFamily.sans],
            mono: ['JetBrains Mono', 'Fira Code', 'Consolas', ...defaultTheme.fontFamily.mono],
        },
    },
},
```

### **app.blade.php**
```html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### **app.css**
```css
@layer base {
  body {
    @apply antialiased;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  
  .font-mono {
    font-feature-settings: 'zero', 'cv11', 'ss01';
    letter-spacing: -0.01em;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold;
    letter-spacing: -0.02em;
  }
}
```

---

## 🎨 **GUÍA DE USO**

### ✅ **Cuándo usar `font-sans` (Inter - Por defecto)**

```jsx
// Texto general
<p>Lorem ipsum dolor sit amet</p>

// Títulos
<h1 className="text-2xl font-bold">Panel de Control</h1>

// Botones
<button className="btn">Guardar</button>

// Navegación
<nav>
  <a href="/">Inicio</a>
</nav>

// Descripciones
<span className="text-gray-600">
  Habitación espaciosa con vista al mar
</span>
```

---

### ✅ **Cuándo usar `font-mono` (JetBrains Mono)**

```jsx
// 💰 Precios
<span className="font-mono font-bold text-primary">€125.00</span>

// 🔢 Números de habitación
<div className="font-mono">Habitación 301</div>

// 📅 Fechas
<td className="font-mono">
  {new Date(reserva.check_in).toLocaleDateString('es-ES')}
</td>

// 🔖 Localizadores/Códigos
<span className="font-mono font-semibold">R4F2K8L</span>

// 📄 Documentos
<span className="font-mono">DNI: 12345678A</span>

// 📊 Datos tabulares
<table>
  <td className="font-mono">€1,250.00</td>
  <td className="font-mono">15/12/2025</td>
</table>
```

---

## 📊 **APLICACIONES EN EL PROYECTO**

### **Componente: IndexReserva.jsx**

```jsx
// Localizador
<td className="font-mono font-semibold">
    {reserva.localizador}
</td>

// Fechas
<td className="celda-fechas font-mono">
    <div>{new Date(reserva.check_in).toLocaleDateString('es-ES')}</div>
    <div className="fecha-checkout">
        → {new Date(reserva.check_out).toLocaleDateString('es-ES')}
    </div>
</td>

// Precio
<td className="celda-precio text-success font-mono">
    €{parseFloat(reserva.precio_total || 0).toFixed(2)}
</td>
```

---

### **Componente: CreateReservaPaso2.jsx**

```jsx
// Precio de habitación
<div className="font-bold text-lg text-primary font-mono">
    €{habitacion.precio_noche}
</div>
```

---

### **Componente: IndexHabitacion.jsx**

```jsx
// Precio por noche
<span className="text-base font-bold text-primary font-mono">
    {habitacion.precio_noche}€
</span>
```

---

## 🎨 **MEJORAS TIPOGRÁFICAS**

### **Antialiasing Mejorado**
```css
body {
  @apply antialiased;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

**Efecto:** Texto más suave y legible en todas las pantallas.

---

### **Letter Spacing Optimizado**

```css
/* Fuente mono: Espaciado compacto para números */
.font-mono {
  letter-spacing: -0.01em;
}

/* Títulos: Espaciado negativo para elegancia */
h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.02em;
}
```

**Efecto:** Títulos más elegantes y números más compactos.

---

### **Font Features (OpenType)**

```css
.font-mono {
  font-feature-settings: 'zero', 'cv11', 'ss01';
}
```

**Características activadas:**
- `zero`: Cero con barra diagonal (0̸) para mejor distinción
- `cv11`: Variante de caracteres mejorada
- `ss01`: Stylistic set alternativo

---

## 📐 **JERARQUÍA TIPOGRÁFICA**

### **Tamaños Recomendados**

| Elemento | Tamaño | Peso | Fuente | Ejemplo |
|----------|--------|------|--------|---------|
| H1 | 2.25rem (36px) | 700 | Inter | Panel de Control |
| H2 | 1.875rem (30px) | 600 | Inter | Habitaciones |
| H3 | 1.5rem (24px) | 600 | Inter | Sección |
| H4 | 1.25rem (20px) | 500 | Inter | Subsección |
| Body | 1rem (16px) | 400 | Inter | Texto normal |
| Small | 0.875rem (14px) | 400 | Inter | Texto secundario |
| Precio | 1.125rem (18px) | 700 | JetBrains | €125.00 |
| Código | 0.9375rem (15px) | 500 | JetBrains | R4F2K8L |

---

## 🎯 **CONSISTENCIA VISUAL**

### **Antes (Fuentes inconsistentes)**
```
❌ Figtree (texto general)
❌ monospace genérico (números)
❌ System fonts (fallback aleatorio)
```

### **Después (Sistema unificado)**
```
✅ Inter (texto general - profesional)
✅ JetBrains Mono (datos técnicos - clara)
✅ Fallbacks consistentes (system-ui → -apple-system)
```

---

## 📱 **RESPONSIVE Y PERFORMANCE**

### **Fuentes Variables**
```css
font-family: 'Inter var', 'Inter', ...
```

**Ventaja:** Una sola descarga incluye todos los pesos (300-800), optimizando el rendimiento.

---

### **Preconnect Optimizado**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Ventaja:** Pre-establece la conexión para cargar fuentes más rápido.

---

### **Display Swap**
```html
&display=swap
```

**Ventaja:** Muestra texto inmediatamente con fuente del sistema, luego cambia a Inter/JetBrains cuando carguen.

---

## 🎨 **EJEMPLOS VISUALES**

### **Tarjeta de Habitación**
```
┌─────────────────────────────────────┐
│ Habitación 301        [Inter Bold]  │
│ Suite Deluxe         [Inter Medium] │
│                                      │
│ Capacidad: 2 personas [Inter Regular]│
│ Precio/noche: €125.00 [JetBrains Bold]│
│                                      │
│ Espaciosa habitación con...         │
│ [Inter Regular, 14px]                │
└─────────────────────────────────────┘
```

---

### **Tabla de Reservas**
```
┌──────────┬──────────────┬─────────────┬───────────┐
│ R4F2K8L  │ Juan Pérez   │ 15/12/2025  │ €250.00   │
│ [Mono]   │ [Inter]      │ [Mono]      │ [Mono]    │
└──────────┴──────────────┴─────────────┴───────────┘
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Inter instalada y configurada
- [x] JetBrains Mono instalada y configurada
- [x] Tailwind config actualizado
- [x] Blade template con fuentes
- [x] CSS global con mejoras tipográficas
- [x] Componentes actualizados con `font-mono`
- [x] Antialiasing mejorado
- [x] Letter spacing optimizado
- [x] Build exitoso

---

## 🚀 **IMPACTO**

### **Profesionalidad**
✅ Fuentes usadas por empresas tech líderes  
✅ Legibilidad superior en interfaces

### **Consistencia**
✅ Sistema unificado en toda la app  
✅ No más fuentes genéricas del sistema

### **Performance**
✅ Variable fonts (menos archivos)  
✅ Preconnect optimizado  
✅ Display swap para UX inmediata

### **Accesibilidad**
✅ Distinción clara entre caracteres  
✅ Legibilidad mejorada  
✅ Antialiasing profesional

---

## 📚 **REFERENCIAS**

- [Inter Font](https://rsms.me/inter/) - Rasmus Andersson
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) - JetBrains
- [Google Fonts](https://fonts.google.com/)

---

**Fecha:** 11 de diciembre de 2025  
**Estado:** ✅ Implementado y funcionando  
**Fuentes:** Inter + JetBrains Mono  
**Build:** ✅ Exitoso  
