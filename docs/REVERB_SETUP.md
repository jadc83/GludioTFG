Guía rápida: instalación y configuración de Reverb (Laravel)
Archivos relacionados (NO modificar — solo se ha editado este MD):

- docs/REVERB_SETUP.md (este archivo — modificado)
- composer.json (indica el paquete `laravel/reverb` instalado)
- config/reverb.php
- config/broadcasting.php
- app/Http/Controllers/ReservaController.php
- app/Events/ReservaCreada.php
- app/Events/ReservaActualizada.php
- resources/js/bootstrap.js
- resources/js/Components/reservas/listado/IndexReserva.jsx
- vendor/laravel/reverb (paquete instalado)

- - -
Qué crea / actualiza automáticamente al ejecutar `php artisan reverb:install`

- Añade variables al archivo `.env` (genera `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` y añade `REVERB_HOST`, `REVERB_PORT`, `REVERB_SCHEME` y variables `VITE_REVERB_*`).
- Publica el archivo de configuración del paquete en `config/reverb.php` (ejecuta `vendor:publish --provider="Laravel\\Reverb\\ReverbServiceProvider" --tag="reverb-config"`).
- Inserta una conexión `reverb` en `config/broadcasting.php` si no existe (bloque con `driver => 'reverb'`, `key/secret/app_id` y `options`).
- Intenta habilitar el broadcasting de Laravel: descomenta `App\\Providers\\BroadcastServiceProvider::class` en `config/app.php` si está comentado y, opcionalmente, ejecuta el instalador de broadcasting (`install:broadcasting`) para crear `routes/channels.php` y los archivos auxiliares.
- Actualiza el `.env` para establecer `BROADCAST_CONNECTION=reverb` (pregunta interactiva durante la instalación).

Notas sobre lo que NO crea automáticamente

- No crea migraciones ni tablas de base de datos.
- No publica vistas ni assets del paquete fuera de `vendor/laravel/reverb` (las vistas se cargan desde `vendor` si procede).
- No modifica controladores ni eventos del proyecto; el instalador sólo agrega/actualiza `.env` y `config`.

Objetivo
- Dejar Reverb (server WebSocket) funcionando en desarrollo para broadcasting con Laravel Echo.

Requisitos
- PHP, Composer
- Node.js, npm/yarn
- Laravel (ya en el proyecto)

1) Instalar el paquete Reverb
- Instala la dependencia (si no está instalada):

  composer require laravel/reverb

(la librería puede variar; en este proyecto ya aparece código y config de Reverb.)

2) Publicar configuración (si el paquete lo provee)
- Publica config/archivos del paquete (si aplica):

  php artisan vendor:publish --provider="Laravel\\Reverb\\ReverbServiceProvider" --tag="reverb-config"

3) Variables de entorno
- Añade en tu `.env` (ejemplo):

  BROADCAST_CONNECTION=reverb
  REVERB_APP_ID=app-id
  REVERB_APP_KEY=app-key
  REVERB_APP_SECRET=app-secret
  REVERB_HOST=127.0.0.1
  REVERB_PORT=8080
  REVERB_SCHEME=http

- Para el frontend con Vite, añade también (opcional):

  VITE_REVERB_APP_KEY=${REVERB_APP_KEY}
  VITE_REVERB_HOST=${REVERB_HOST}
  VITE_REVERB_PORT=${REVERB_PORT}
  VITE_REVERB_SCHEME=${REVERB_SCHEME}

4) Configurar `config/broadcasting.php`
- Asegúrate de tener una conexión `reverb` en `config/broadcasting.php`. Ejemplo resumido:

  'connections' => [
      'reverb' => [
          'driver' => 'pusher',
          'key' => env('REVERB_APP_KEY'),
          'secret' => env('REVERB_APP_SECRET'),
          'app_id' => env('REVERB_APP_ID'),
          'options' => [
              'host' => env('REVERB_HOST', '127.0.0.1'),
              'port' => env('REVERB_PORT', 8080),
              'scheme' => env('REVERB_SCHEME', 'http'),
              'encrypted' => false,
          ],
      ],
  ]

5) Evento en Laravel
- Crea eventos que implementen `ShouldBroadcast` o `ShouldBroadcastNow` (en desarrollo `ShouldBroadcastNow` entrega síncrona):

  use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

  class ReservaActualizada implements ShouldBroadcastNow
  {
      public $reserva;
      public function __construct($reserva) { $this->reserva = $reserva; }
      public function broadcastOn() { return new Channel('reservas.' . $this->reserva->id); }
      public function broadcastWith() { return [ 'id' => $this->reserva->id, 'status' => $this->reserva->status ]; }
  }

6) Frontend (Laravel Echo + Pusher)
- En `resources/js/bootstrap.js` inicializa Echo con Pusher y las variables Vite/env:

  import Echo from 'laravel-echo';
  import Pusher from 'pusher-js';

  window.Pusher = Pusher;
  window.Echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
      wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
  });

- Suscribe componentes a canales:

  // canal público example
  window.Echo.channel('reservas').listen('ReservaCreada', (e) => { /* actualizar UI */ });

  // canal privado por id
  window.Echo.private('reservas.' + reservaId).listen('ReservaActualizada', (e) => { /* actualizar detalle */ });

7) Ejecutar servidor Reverb y cola
- Inicia servidor Reverb (según comandos del paquete):

  php artisan reverb:start
  php artisan reverb:restart

- Si los eventos usan `ShouldBroadcast` (no Now), arranca worker de colas:

  php artisan queue:work

8) Compilar frontend
- En desarrollo:

  npm run dev

- En producción:

  npm run build

9) Pruebas y depuración
- Limpia caché/ configuración si haces cambios en `.env` o `config`:

  php artisan config:clear
  php artisan cache:clear

- Verifica que Reverb escuche en el puerto configurado:

  netstat -ano | findstr :8080

- Prueba disparar evento desde Tinker:

  php artisan tinker
  >>> event(new App\Events\ReservaCreada(App\Models\Reserva::find(123)));

- Si no aparecen mensajes en el navegador, revisa:
  - Protocolo: `ws://` vs `wss://` (usar `wss` si TLS)
  - Puertos bloqueados o conflictos
  - Coincidencia de `key`/`app_id`
  - Mensajes de error en consola del navegador

10) Buenas prácticas
- Para datos sensibles usa `PrivateChannel` y configura auth en Echo (laravel-echo + axios). 
- En producción usa TLS (`wss`) y un servidor WebSocket separado o servicio gestionado.

Implementación en este proyecto

- Controlador: en `app/Http/Controllers/ReservaController.php` se emiten los eventos relacionados con reservas:
  - `event(new \App\Events\ReservaCreada($reserva));` cuando se crea una reserva (método `store`).
  - `event(new \App\Events\ReservaActualizada($reserva));` cuando se actualiza una reserva (método `update`).
  Consulta el controlador para ver el flujo de creación/actualización: [app/Http/Controllers/ReservaController.php](app/Http/Controllers/ReservaController.php#L1-L220).

- Eventos: las clases de evento implementan `ShouldBroadcastNow` y usan `PrivateChannel`:
  - `app/Events/ReservaCreada.php` — difunde en `new PrivateChannel('reservas')`.
  - `app/Events/ReservaActualizada.php` — difunde en `new PrivateChannel('reservas')` y `new PrivateChannel('reservas.{id}')`.
  Estas clases envían los datos mínimos necesarios en `broadcastWith()` (id, localizador, status, fechas, precio).
  Ver fuentes: [app/Events/ReservaCreada.php](app/Events/ReservaCreada.php#L1-L80) y [app/Events/ReservaActualizada.php](app/Events/ReservaActualizada.php#L1-L120).

- Configuración de broadcasting: el proyecto usa una conexión `reverb` en `config/broadcasting.php` con driver tipo `reverb` (el adaptador actúa como driver `pusher` en el cliente). Revisa [config/broadcasting.php](config/broadcasting.php#L1-L120) y [config/reverb.php](config/reverb.php#L1-L120) para parámetros de servidor y apps.

- Frontend: Echo se inicializa en `resources/js/bootstrap.js` usando `pusher-js` apuntando al servidor Reverb (host/port/key desde `VITE_REVERB_*` o `REVERB_*`).
  - El componente de listado de reservas `resources/js/Components/reservas/listado/IndexReserva.jsx` se suscribe al canal privado `reservas` y escucha los eventos `ReservaCreada` y `ReservaActualizada` para forzar una recarga/refresh de la tabla.
  - Rutas de autenticación para canales privados seguirán usando la ruta de broadcasting de Laravel (`/broadcasting/auth`) y requieren autenticación por defecto.
  Ver inicialización y suscripción en: [resources/js/bootstrap.js](resources/js/bootstrap.js#L1-L80) y [resources/js/Components/reservas/listado/IndexReserva.jsx](resources/js/Components/reservas/listado/IndexReserva.jsx#L40-L60).

- Comportamiento importante:
  - Los eventos usan `ShouldBroadcastNow`, por lo que se transmiten de forma síncrona sin necesidad de workers de cola (útil en desarrollo).
  - Al usar `PrivateChannel` es necesario que el cliente esté autenticado y que la ruta de auth de broadcasting (por defecto `/broadcasting/auth`) devuelva autorización.

Notas finales
- En este proyecto el paquete instalado es `laravel/reverb` (ver `composer.json`).
- El proveedor de servicio y comandos provienen del namespace `Laravel\\Reverb` (ej. `Laravel\\Reverb\\ReverbServiceProvider`).
- Al publicar la configuración use el tag `reverb-config` o `reverb` según prefieras; el paquete registra ambos.
- Esta guía asume que ya existen `php artisan reverb:*` y `config/reverb.php` en el repo.

Si quieres, preparo un archivo de ejemplo `App\Events\ReservaActualizada.php` y las líneas exactas a añadir en `config/broadcasting.php` y `resources/js/bootstrap.js` adaptadas al proyecto. Dime si lo dejo así y lo genero automáticamente.
