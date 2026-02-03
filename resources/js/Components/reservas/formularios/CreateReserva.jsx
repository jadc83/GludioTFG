// DEPRECATED compatibility module
// Old import path: '@/Components/reservas/formularios/CreateReserva'
// New preferred path: '@/Components/reservas/formularios/pms/CreateReserva'
// Please update imports to the new path. This module will be removed in a future change.

// Emit a console warning at import time so leftover imports are obvious at runtime.
if (typeof globalThis !== 'undefined' && !globalThis.__createReservaCompatWarned) {
    // eslint-disable-next-line no-console
    console.warn("DEPRECATION: import from '@/Components/reservas/formularios/CreateReserva' is deprecated. Use '@/Components/reservas/formularios/pms/CreateReserva' instead.");
    globalThis.__createReservaCompatWarned = true;
}

export { default } from './pms/CreateReserva';
