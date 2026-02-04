// DEPRECATED compatibility module
// Old import path: '@/Components/reservas/formularios/CreateReserva'
// New preferred path: '@/Components/reservas/formularios/pms/CreateReserva'
// Please update imports to the new path. This module will be removed in a future change.

// Emit a console warning at import time so leftover imports are obvious at runtime.
if (typeof globalThis !== 'undefined' && !globalThis.__createReservaCompatWarned) {
    // Compatibility import used elsewhere; deprecation warning removed to avoid noisy console output
    globalThis.__createReservaCompatWarned = true;
}

export { default } from './pms/CreateReserva';
