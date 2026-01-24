/**
 * Helpers para normalizar la limpieza de formularios Inertia/UseForm.
 * exportamos una función que llama a `reset` y `clearErrors` de forma consistente.
 */
export function limpiarFormulario(resetFn, clearErrorsFn, ...fields) {
  try {
    if (typeof resetFn === 'function') {
      if (fields && fields.length) resetFn(...fields);
      else resetFn();
    }
  } catch (e) {
    // noop
  }

  try {
    if (typeof clearErrorsFn === 'function') {
      if (fields && fields.length) clearErrorsFn(...fields);
      else clearErrorsFn();
    }
  } catch (e) {
    // noop
  }
}
