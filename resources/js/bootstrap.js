import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Enviar cookies de sesión en peticiones XHR (necesario para dev/puerto cruzado)
window.axios.defaults.withCredentials = true;

// Asegurar que axios use la cookie XSRF y la envíe como X-XSRF-TOKEN
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Si existe meta csrf-token, añadirlo como header X-CSRF-TOKEN (compatibilidad)
const metaCsrf = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]') : null;
if (metaCsrf) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = metaCsrf.getAttribute('content');
}

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const REVERB_KEY =
    import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.REVERB_APP_KEY || '';
const REVERB_HOST =
    import.meta.env.VITE_REVERB_HOST ||
    import.meta.env.REVERB_HOST ||
    '127.0.0.1';
const REVERB_PORT =
    import.meta.env.VITE_REVERB_PORT || import.meta.env.REVERB_PORT || '8080';
const REVERB_SCHEME =
    import.meta.env.VITE_REVERB_SCHEME ||
    import.meta.env.REVERB_SCHEME ||
    'http';

window.Pusher = Pusher;

const csrfToken =
    typeof document !== 'undefined'
        ? document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute('content')
        : null;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: REVERB_KEY,
    cluster: 'mt1',
    wsHost: REVERB_HOST,
    wsPort: Number(REVERB_PORT),
    wssPort: Number(REVERB_PORT),
    forceTLS: REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    // Add auth headers so /broadcasting/auth receives CSRF token and proper X-Requested-With
    auth: {
        headers: {
            'X-CSRF-TOKEN': csrfToken || '',
            'X-Requested-With': 'XMLHttpRequest',
        },
    },
});
