import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Enviar cookies de sesión en peticiones XHR (necesario para dev/puerto cruzado)
window.axios.defaults.withCredentials = true;

// Asegurar que axios use la cookie XSRF y la envíe como X-XSRF-TOKEN
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

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
    // Auth headers: rely on cookie-based CSRF (XSRF-TOKEN). Keep X-Requested-With.
    auth: (function() {
        const headers = { 'X-Requested-With': 'XMLHttpRequest' };
        try {
            const t = window.getCsrfToken && window.getCsrfToken();
            if (t) headers['X-XSRF-TOKEN'] = t;
        } catch (e) {
            // ignore
        }
        return { headers };
    })(),
});

// Helper: obtener token CSRF: prefer Inertia page.props.csrf_token, fall back to XSRF-TOKEN cookie
window.getCsrfToken = function () {
    if (typeof document === 'undefined') return '';
    try {
        // eslint-disable-next-line no-undef
        const fromPage = (typeof page !== 'undefined' && page.props && page.props.csrf_token) || '';
        if (fromPage) return fromPage;
    } catch (e) {
        // ignore
    }
    const cookie = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
    if (!cookie) return '';
    try {
        return decodeURIComponent(cookie.split('=')[1] || '');
    } catch (e) {
        return '';
    }
};

// Wrapper de fetch que inyecta CSRF y cabeceras por defecto (usa X-XSRF-TOKEN header)
window.fetchWithCsrf = async function (url, options = {}) {
    const opts = Object.assign({ credentials: 'same-origin', headers: {} }, options || {});
    const headers = Object.assign({}, opts.headers || {});
    if (!headers['X-XSRF-TOKEN'] && !headers['x-xsrf-token'] && !headers['X-CSRF-TOKEN']) {
        const t = window.getCsrfToken();
        if (t) headers['X-XSRF-TOKEN'] = t;
    }
    // cabeceras por defecto para peticiones internas
    opts.headers = Object.assign({ 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' }, headers);
    return fetch(url, opts);
};
