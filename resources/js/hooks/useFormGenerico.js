import { useForm } from '@inertiajs/react';
import { useCallback } from 'react';
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
    const cambiar = useCallback(
        (evento) => {
            const { name, value, type, checked } = evento.target;
            const valorFinal = type === 'checkbox' ? checked : value;
            setData(name, valorFinal);
        },
        [setData],
    );

    /* Pre-rellena el formulario con datos existentes */
    const cargarDatos = useCallback(
        (datos) => {
            if (datos) {
                setData(datos);
            }
        },
        [setData],
    );

    /**
     * Resetea el formulario a valores iniciales
     */
    const limpiar = useCallback(() => {
        limpiarFormulario(resetFormulario, clearErrors);
    }, [resetFormulario, clearErrors]);

    /**
     * Envía el formulario al servidor
     */
    const guardar = useCallback(
        (evento = null, options = {}) => {
            // Support calling guardar(payload, options) to submit a given payload directly
            // If "evento" is a DOM event, prevent Default as usual.
            // If it's a plain object (no preventDefault) we treat it as a data override.
            let dataOverride = null;
            if (
                evento &&
                typeof evento === 'object' &&
                typeof evento.preventDefault === 'function'
            ) {
                evento.preventDefault();
            } else if (
                evento &&
                typeof evento === 'object' &&
                typeof evento.preventDefault === 'undefined'
            ) {
                dataOverride = evento;
                evento = null;
            }

            const mergedOptions = Object.assign({}, options);

            if (esEdicion) {
                // Actualizar registro
                const metodo = metodoActualizacion === 'patch' ? patch : put;

                if (dataOverride) {
                    metodo(
                        rutaActualizar,
                        dataOverride,
                        Object.assign({}, mergedOptions, {
                            onSuccess: (page) => {
                                if (alGuardar) alGuardar(page);
                                if (typeof mergedOptions.onSuccess === 'function') mergedOptions.onSuccess(page);
                            },
                        }),
                    );
                } else {
                    metodo(
                        rutaActualizar,
                        formulario,
                        Object.assign({}, mergedOptions, {
                            onSuccess: (page) => {
                                if (alGuardar) alGuardar(page);
                                if (typeof mergedOptions.onSuccess === 'function') mergedOptions.onSuccess(page);
                            },
                        }),
                    );
                }
            } else {
                // Crear nuevo registro
                if (dataOverride) {
                    post(
                        rutaCrear,
                        dataOverride,
                        Object.assign({}, mergedOptions, {
                            onSuccess: (page) => {
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
                            },
                        }),
                    );
                } else {
                    post(
                        rutaCrear,
                        formulario,
                        Object.assign({}, mergedOptions, {
                            onSuccess: (page) => {
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
                            },
                        }),
                    );
                }
            }
        },
        [
            esEdicion,
            rutaActualizar,
            rutaCrear,
            metodoActualizacion,
            alGuardar,
            post,
            put,
            patch,
            limpiar,
            formulario,
        ],
    );

    /**
     * Actualiza un campo específico directamente
     */
    const actualizarCampo = useCallback(
        (campo, valor) => {
            setData(campo, valor);
        },
        [setData],
    );

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
