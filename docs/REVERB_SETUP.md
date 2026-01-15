Guía rápida: instalación y configuración de Reverb (Laravel)

Objetivo
- Dejar Reverb (server WebSocket) funcionando en desarrollo para broadcasting con Laravel Echo.

Requisitos
- PHP, Composer
- Node.js, npm/yarn
- Laravel (ya en el proyecto)

1) Instalar el paquete Reverb
- Instala la dependencia (si no está instalada):

  composer require ta-tikoma/reverb

(la librería puede variar; en este proyecto ya aparece código y config de Reverb.)

2) Publicar configuración (si el paquete lo provee)
- Publica config/archivos del paquete (si aplica):

  php artisan vendor:publish --provider="TaTikoma\Reverb\ReverbServiceProvider" --tag="config"

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

Notas finales
- Esta guía asume que el paquete Reverb ya está presente en el proyecto (en este repo ya existen `php artisan reverb:*` y `config/reverb.php`). Ajusta nombres de provider/tag según el paquete que uses.

Si quieres, preparo un archivo de ejemplo `App\Events\ReservaActualizada.php` y las líneas exactas a añadir en `config/broadcasting.php` y `resources/js/bootstrap.js` adaptadas al proyecto. Dime si lo dejo así y lo genero automáticamente.
