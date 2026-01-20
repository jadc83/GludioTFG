import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Hook generico para gestionar formularios Inertia
 * agrupa la lógica común de crear/editar registros
 */
export function useFormGenerico( datosIniciales = {}, rutaCrear = '', rutaActualizar = '', alGuardar = null, metodoActualizacion = 'put') {

    const esEdicion = !!rutaActualizar;
    const { data: formulario, setData, post, put, patch, processing: estaCargando, errors: errores, reset: resetFormulario, clearErrors } = useForm(datosIniciales);

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
        resetFormulario();
        clearErrors();
    };

    /**
     * Envía el formulario al servidor
     */
    const guardar = (evento = null) => {
        if (evento) {
            evento.preventDefault();
        }

        if (esEdicion) {
            // Actualizar registro
            const metodo = metodoActualizacion === 'patch' ? patch : put;
            metodo(rutaActualizar, {
                onSuccess: () => {
                    if (alGuardar) {
                        alGuardar();
                    }
                },
            });
        } else {
            // Crear nuevo registro
            post(rutaCrear, {
                onSuccess: () => {
                    limpiar();
                    if (alGuardar) {
                        alGuardar();
                    }
                },
            });
        }
    };

    /**
     * Actualiza un campo específico directamente
     */
    const actualizarCampo = (campo, valor) => { setData(campo, valor); };

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
