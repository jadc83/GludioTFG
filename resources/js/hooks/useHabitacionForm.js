import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { limpiarFormulario } from './useFormHelpers';

// Las capacidades ahora se obtienen desde los tipos de habitación inyectados por Inertia
const MAX_FOTOS = 4;

export function useHabitacionForm(habitacionInicial = null, alGuardar = null) {
    const esEdicion = !!habitacionInicial?.id;

    const { props } = usePage();
    const tiposHabitacion = props.tiposHabitacion || {};

    const capacidadPorTipo = (tipo) => {
        if (!tipo) return '';
        const key = tipo.toLowerCase();
        return tiposHabitacion[key]?.capacidad ?? '';
    };

    const tipoPorDefecto = 'doble';
    const capacidadDefecto = capacidadPorTipo(tipoPorDefecto) || 2;

    const { data: formulario, setData, processing: estaCargando, errors: errores, reset: resetForm, clearErrors } = useForm({
        numero: '', tipo: tipoPorDefecto, capacidad: capacidadDefecto, estado: 'disponible', descripcion: '', notas: '' });

    // Estados para manejo de fotos
    const [fotos, setFotos] = useState([]);
    const [previsualizaciones, setPresualizaciones] = useState([]);
    const [fotosGuardadas, setFotosGuardadas] = useState([]);
    const [fotosAEliminar, setFotosAEliminar] = useState([]);

    /**
     * Carga datos de la habitación inicial cuando entra en modo edición
     */
    useEffect(() => {
        if (esEdicion && habitacionInicial) {
            setData({
                numero: habitacionInicial.numero || '',
                tipo: habitacionInicial.tipo || 'doble',
                capacidad:
                    habitacionInicial.capacidad ||
                    capacidadPorTipo(habitacionInicial.tipo),
                estado: habitacionInicial.estado || 'disponible',
                descripcion: habitacionInicial.descripcion || '',
                notas: habitacionInicial.notas || '',
            });

            const fotosExistentes = (habitacionInicial.fotos || []).map((foto) => ({
                id: foto.id,
                url: foto.url || `/storage/${foto.ruta}`,
                ruta: foto.ruta,
            }));
            setFotosGuardadas(fotosExistentes);
            setPresualizaciones(fotosExistentes.map((p) => p.url));
            setFotos([]);
            setFotosAEliminar([]);
            clearErrors();
        }
    }, [ esEdicion, habitacionInicial, habitacionInicial?.id, setData, clearErrors]);

    /**
     * Actualiza un campo del formulario
     * Si se cambia el tipo, actualiza la capacidad automáticamente
     */
    const cambiar = (event) => {
        const { name, value } = event.target;
        setData((datosActuales) => ({
            ...datosActuales,
            [name]: value,
            // Si cambia el tipo, actualizar capacidad según tiposHabitacion
            ...(name === 'tipo' && { capacidad: capacidadPorTipo(value) || '' }),
        }));
    };

    /**
     * Agrega fotos al formulario y genera previsualizaciones
     * Límite: 4 fotos totales (nuevas + guardadas)
     */
    const agregarFotos = async (event) => {
        const totalActual = fotosGuardadas.length + fotos.length;
        const archivos = Array.from(event.target.files).slice(
            0,
            MAX_FOTOS - totalActual,
        );

        if (!archivos.length) return;

        setFotos((prev) => [...prev, ...archivos]);

        // Leer archivos como Data URLs para previsualización
        const leerArchivoComoDataUrl = (archivo) =>
            new Promise((resolve) => {
                const lector = new FileReader();
                lector.onload = (ev) => resolve(ev.target.result);
                lector.readAsDataURL(archivo);
            });

        try {
            const nuevasPrevisualizaciones = await Promise.all(archivos.map(leerArchivoComoDataUrl));
            setPresualizaciones((prev) => [...prev, ...nuevasPrevisualizaciones]);
        } catch (error) {
            // Continuar sin fallar si hay error en lectura
        }

        // Limpiar input para permitir seleccionar el mismo archivo de nuevo
        event.target.value = '';
    };

    /* Elimina una foto por índice */
    const quitarFoto = (indice) => {
        if (indice < fotosGuardadas.length) {
            // Es una foto guardada - marcar para eliminar del servidor
            const fotoAEliminar = fotosGuardadas[indice];
            if (fotoAEliminar?.id) {
                setFotosAEliminar((prev) => [...prev, fotoAEliminar.id]);
            }
            setFotosGuardadas((prev) => prev.filter((_, i) => i !== indice));
        } else {
            // Es una foto nueva - eliminar del array
            const nuevoIndice = indice - fotosGuardadas.length;
            setFotos((prev) => prev.filter((_, i) => i !== nuevoIndice));
        }
        setPresualizaciones((prev) => prev.filter((_, i) => i !== indice));
    };

    /* Envía el formulario al servidor (crear o actualizar habitación) */
    const enviar = (event) => {
        event.preventDefault();
        const datosFormulario = new FormData();
        Object.entries(formulario).forEach(([clave, valor]) => {
            datosFormulario.append(clave, valor);
        });

        // Agregar fotos nuevas
        fotos.forEach((foto) => {
            datosFormulario.append('fotos[]', foto);
        });

        if (esEdicion) {
            // Agregar IDs de fotos a eliminar
            fotosAEliminar.forEach((id) => {
                datosFormulario.append('fotos_eliminar[]', id);
            });

            // Usar método PUT via _method
            datosFormulario.append('_method', 'PUT');

            router.post(`/habitaciones/${habitacionInicial.id}`, datosFormulario, { preserveState: false,  preserveScroll: false,
                onSuccess: () => {
                    router.reload();
                    reset();
                    alGuardar?.();
                },
                onError: (errores) => {
                },
            });
        } else {
            // Crear nueva habitación
            router.post('/habitaciones', datosFormulario, {
                preserveState: false,
                preserveScroll: false,
                onSuccess: () => {
                    reset();
                    alGuardar?.();
                },
            });
        }
    };

    /**
     * Resetea todos los campos y estados del formulario
     */
    const reset = () => {
        limpiarFormulario(resetForm, clearErrors);
        setFotos([]);
        setPresualizaciones([]);
        setFotosGuardadas([]);
        setFotosAEliminar([]);
    };

    // Verificar si la capacidad es fija para este tipo
    const capacidadFija = Object.prototype.hasOwnProperty.call(
        tiposHabitacion,
        formulario.tipo,
    );

    return { formulario, fotos, previsualizaciones, fotosGuardadas, errores, estaCargando, capacidadFija, MAX_FOTOS,
        esEdicion, cambiar, agregarFotos, quitarFoto, enviar, reset, clearErrors };
}
