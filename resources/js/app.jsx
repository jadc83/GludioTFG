import '../css/app.css';
import '../css/paso2Habitaciones.css';
import '../css/paso3Datos.css';
import './bootstrap';

// Polyfill fetch para navegadores legacy (usar UMD para compatibilidad con Vite)
import 'whatwg-fetch/dist/fetch.umd.js';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);

        // No listeners globales: los componentes interesados se suscriben localmente.
    },
    progress: {
        color: '#4B5563',
    },
});
