import { useForm } from '@inertiajs/react';
import { limpiarFormulario } from './useFormHelpers';

/**
 * Hook generico para gestionar formularios Inertia
 * agrupa la lógica común de crear/editar registros
 */
export function useFormGenerico(
    datosIniciales = {},
    rutaCrear = '',
    rutaActualizar = '',
    alGuardar = null,
    metodoActualizacion = 'put',
) {
    const esEdicion = !!rutaActualizar;
    const {
        data: formulario,
        setData,
        post,
        put,
        patch,
        processing: estaCargando,
        errors: errores,
        reset: resetFormulario,
        clearErrors,
    } = useForm(datosIniciales);

    /* Actualiza un campo del formulario */
    const cambiar = (evento) => {
        const { name, value, type, checked } = evento.target;
        const valorFinal = type === 'checkbox' ? checked : value;
        setData(name, valorFinal);
    };

    /* Pre-rellena el formulario con datos existentes */
    const cargarDatos = (datos) => {
        if (datos) {
            setData(datos);
        }
    };

    /**
     * Resetea el formulario a valores iniciales
     */
    const limpiar = () => {
        limpiarFormulario(resetFormulario, clearErrors);
    };

    /**
     * Envía el formulario al servidor
     */
    const guardar = (evento = null, options = {}) => {
        // Support calling guardar(payload, options) to submit a given payload directly
        // If "evento" is a DOM event, prevent Default as usual.
        // If it's a plain object (no preventDefault) we treat it as a data override.
        let dataOverride = null;
        if (evento && typeof evento === 'object' && typeof evento.preventDefault === 'function') {
            evento.preventDefault();
        } else if (evento && typeof evento === 'object' && typeof evento.preventDefault === 'undefined') {
            dataOverride = evento;
            evento = null;
        }

        const mergedOptions = Object.assign({}, options);

        if (esEdicion) {
            // Actualizar registro
            const metodo = metodoActualizacion === 'patch' ? patch : put;

            if (dataOverride) {
                // post/put with explicit data override (inertia supports post/put(url, data, options))
                metodo(rutaActualizar, dataOverride, Object.assign({}, mergedOptions, {
                    onSuccess: (page) => {
                        if (alGuardar) {
                            alGuardar(page);
                        }
                        if (typeof mergedOptions.onSuccess === 'function') mergedOptions.onSuccess(page);
                    }
                }));
            } else {
                metodo(rutaActualizar, Object.assign({}, mergedOptions, {
                    onSuccess: (page) => {
                        if (alGuardar) {
                            alGuardar(page);
                        }
                        if (typeof mergedOptions.onSuccess === 'function') mergedOptions.onSuccess(page);
                    }
                }));
            }
        } else {
            // Crear nuevo registro
            if (dataOverride) {
                post(rutaCrear, dataOverride, Object.assign({}, mergedOptions, {
                    onSuccess: (page) => {
                        // Si el llamante proporcionó un callback 'alGuardar', delegamos la lógica
                        // (por ejemplo cerrar el modal o limpiar), para evitar borrar campos
                        // inesperadamente en flujos compuestos como CreateReserva.
                        if (alGuardar) {
                            alGuardar(page);
                        } else {
                            limpiar();
                        }
                        if (typeof mergedOptions.onSuccess === 'function') mergedOptions.onSuccess(page);
                    },
                    onError: (errors) => {
                        if (typeof mergedOptions.onError === 'function') mergedOptions.onError(errors);
                    },
                    onFinish: () => {
                        if (typeof mergedOptions.onFinish === 'function') mergedOptions.onFinish();
                    }
                }));
            } else {
                post(rutaCrear, Object.assign({}, mergedOptions, {
                    onSuccess: (page) => {
                        // Si el llamante proporcionó un callback 'alGuardar', delegamos la lógica
                        // (por ejemplo cerrar el modal o limpiar), para evitar borrar campos
                        // inesperadamente en flujos compuestos como CreateReserva.
                        if (alGuardar) {
                            alGuardar(page);
                        } else {
                            limpiar();
                        }
                        if (typeof mergedOptions.onSuccess === 'function') mergedOptions.onSuccess(page);
                    },
                    onError: (errors) => {
                        if (typeof mergedOptions.onError === 'function') mergedOptions.onError(errors);
                    },
                    onFinish: () => {
                        if (typeof mergedOptions.onFinish === 'function') mergedOptions.onFinish();
                    }
                }));
            }
        }
    };

    /**
     * Actualiza un campo específico directamente
     */
    const actualizarCampo = (campo, valor) => {
        setData(campo, valor);
    };

    return {
        // Estado del formulario
        formulario,
        errores,
        estaCargando,

        // Métodos de actualización
        setData,
        cambiar,
        actualizarCampo,
        cargarDatos,
        guardar,
        limpiar,

        // Información de estado
        esEdicion,
    };
}
