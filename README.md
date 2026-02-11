# Hotel Gludio - Property Management System (PMS)

## 1. Introducción
**Hotel Gludio** es una solución integral de gestión hotelera desarrollada con un stack moderno. La plataforma permite la gestión completa del ciclo de vida de una estancia, incluyendo la reserva de habitaciones, procesamiento de pagos, gestión de tareas del personal y análisis estadístico de ocupación.

## 2. Arquitectura Tecnológica

### Backend
* **Framework:** Laravel 12.0.
* **Lenguaje:** PHP 8.3.
* **Autenticación:** Laravel Breeze y Sanctum.
* **Procesamiento de Pagos:** Stripe mediante Laravel Cashier.
* **Comunicación en Tiempo Real:** Laravel Reverb (WebSockets).
* **Generación de Documentos:** Barryvdh Laravel DomPDF.
* **Gestión de Permisos:** Spatie Laravel Permission.

### Frontend
* **Core:** React 18.2.
* **Adaptador:** Inertia.js 2.0.
* **Estilos:** Tailwind CSS v3 y DaisyUI v5.
* **Gestión de Estado:** TanStack React Query v5.
* **Componentes de UI:** Headless UI y Heroicons.
* **Gráficos:** Recharts y Chart.js.
* **Calendarios:** FullCalendar.

## 3. Características Principales

### Gestión de Reservas y Clientes
* **Motor de Reservas:** Flujo de reserva dividido en pasos (selección de fechas, habitaciones, datos y confirmación).
* **Detección de Clientes:** Sistema automático para identificar clientes existentes mediante documentos de identidad.
* **Check-in/out:** Acciones específicas para marcar la entrada y salida de los huéspedes.
* **Escaneo QR:** Integración de lector de códigos QR para agilizar procesos.

### Operaciones del Hotel
* **Gestión de Tareas:** Asignación y seguimiento de labores para el personal (limpieza, mantenimiento, etc.).
* **Control de Turnos:** Calendario de turnos para empleados integrado en el perfil.
* **Departamentos:** Organización del personal por áreas operativas.
* **Cupones:** Sistema de descuentos aplicables a las reservas.

### Finanzas y Análisis
* **Pagos Seguros:** Integración completa con la pasarela Stripe para cobros y reembolsos.
* **Gestión de Reembolsos:** Flujo de aprobación para solicitudes de devolución.
* **Panel de Control:** Visualización de métricas de ocupación y estadísticas en tiempo real.

## 4. Estructura del Proyecto

### Lógica de Negocio (Acciones y Servicios)
El proyecto utiliza el patrón de diseño *Action* y *Service* para desacoplar la lógica de los controladores:
* `app/Actions/`: Contiene lógica atómica como `CreateReservaAction` o `CalcularPrecioAction`.
* `app/Services/`: Agrupa lógica compleja como `PaymentService`, `ReservaDisponibilidadService` y `PdfService`.

### Base de Datos
El esquema incluye tablas para:
* Habitaciones y sus tipos (Single, Double, Suite).
* Servicios y tarifas dinámicas.
* Gestión de personal y nóminas operativas.

## 5. Instalación y Despliegue

1.  **Configuración Inicial:**
    ```bash
    composer run setup
    ```
    *Este comando instala dependencias, genera claves, crea la base de datos SQLite y compila los assets.*

2.  **Ejecución del Entorno de Desarrollo:**
    El proyecto incluye un script de automatización para iniciar todos los servicios necesarios simultáneamente (Servidor Laravel, Vite y Reverb):
    ```bash
    ./iniciar.sh
    ```
   

## 6. Pruebas y Calidad
* **Backend:** Utiliza Pest PHP para pruebas de características (Auth, Pagos, Reservas).
* **Frontend:** Vitest y React Testing Library para componentes y hooks.
* **Análisis Estático:** Configurado con PHPStan y ESLint.

## 7. Compatibilidad de Navegadores y ES2015

Se han aplicado cambios para mejorar la compatibilidad con navegadores modernos y legacy:

- **Objetivo:** Mantener código en sintaxis ES2015+ (imports, arrow functions, clases) y generar bundles compatibles con navegadores que no soportan ES modules nativos.
- **Cambios realizados:**
    - Añadido `browserslist` en `package.json` para definir targets de navegación.
    - Integrado `@vitejs/plugin-legacy` en `vite.config.js` para generar bundles legacy además de los bundles modernos.
    - Añadido polyfill de `fetch` mediante `whatwg-fetch` y importado en `resources/js/app.jsx`.
    - Evitar problemas de carga de módulos: la importación apunta al UMD `whatwg-fetch/dist/fetch.umd.js` para compatibilidad con Vite.

- **Archivos modificados:**
    - `package.json` (se añadió `browserslist` y script `test:e2e`).
    - `vite.config.js` (se importó y configuró `@vitejs/plugin-legacy`).
    - `resources/js/app.jsx` (se añadió import de `whatwg-fetch/dist/fetch.umd.js`).

- **Política y alcance:**
    - Con la configuración actual Vite genera bundles modernos y legacy (public/build). Esto cubre la mayoría de navegadores modernos y algunos antiguos; no incluye soporte para navegadores EOL como IE11.
    - Si necesitas soporte completo para `Intl` (formatos de fecha/moneda en navegadores muy antiguos), recomiendo añadir `@formatjs/intl-datetimeformat` y los datos locales necesarios.

## 8. Verificación automática (E2E)

Se añadió una suite mínima de pruebas E2E con Playwright para comprobar compatibilidad en navegadores importantes:

- **Configuración:** `playwright.config.ts` (proyectos para `firefox`, `edge` y `brave`).
- **Pruebas:** `tests/e2e/browser-compat.spec.ts` (smoke test que carga la página principal y verifica el contenedor `#app`).

- **Comandos útiles:**
    - Compilar assets y generar bundles (modern + legacy):
        ```bash
        npm run build
        ```
    - Ejecutar pruebas E2E (requiere servidor Laravel corriendo en `http://127.0.0.1:8000`):
        ```bash
        npm run test:e2e
        # o directamente
        npx playwright test
        ```
    - Mostrar el informe HTML generado por Playwright:
        ```bash
        npx playwright show-report
        ```

## 9. Estado actual y próximos pasos

- Se probaron las builds y se ejecutaron pruebas E2E en **Chrome**, **Brave**, **Firefox** y **Edge**; los smoke tests pasaron correctamente en estos navegadores.
- Si deseas, puedo:
    - Añadir polyfills para `Intl` y regenerar la build.
    - Eliminar los logs temporales añadidos durante depuración.


---
*Desarrollado para la gestión eficiente de Hotel Gludio.*
