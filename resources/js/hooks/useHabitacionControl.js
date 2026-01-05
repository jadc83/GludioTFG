import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import useRetraso from './useRetraso';
import { useSincronizarFiltros } from './useSincronizarFiltros';

export function useHabitacionControl(habitaciones = []) {
    // Configuración inicial de filtros
    const filtrosIniciales = {
        estado: 'todos',
        tipo: 'todos',
        capacidad: 'todos',
        precio_min: '',
        precio_max: '',
        busqueda: '',
    };

    // Utilizar hook para sincronizar filtros con URL
    const {
        filtros,
        actualizarFiltro,
        limpiarFiltros,
        hayFiltrosActivos,
    } = useSincronizarFiltros(filtrosIniciales, 'panel', ['habitaciones']);

    // Aplicar retraso de 500ms a las búsquedas
    const busquedaRetrasada = useRetraso(filtros.busqueda, 500);

    /**
     * Actualizar resultados cuando cambian los filtros
     */
    useEffect(() => {
        // Construir objeto de filtros activos (excluyendo valores "todos")
        const filtrosActivos = {
            estado: filtros.estado !== 'todos' ? filtros.estado : undefined,
            tipo: filtros.tipo !== 'todos' ? filtros.tipo : undefined,
            capacidad:
                filtros.capacidad !== 'todos' ? filtros.capacidad : undefined,
            precio_min: filtros.precio_min || undefined,
            precio_max: filtros.precio_max || undefined,
            busqueda: busquedaRetrasada || undefined,
        };

        router.get(route('panel'), filtrosActivos, {
            preserveState: true,
            preserveScroll: true,
            only: ['habitaciones'],
            replace: true,
        });
    }, [
        filtros.estado,
        filtros.tipo,
        filtros.capacidad,
        filtros.precio_min,
        filtros.precio_max,
        busquedaRetrasada,
    ]);

    return {
        // Estado de filtros
        filtros: {
            estado: filtros.estado,
            setEstado: (valor) => actualizarFiltro('estado', valor),
            tipo: filtros.tipo,
            setTipo: (valor) => actualizarFiltro('tipo', valor),
            capacidad: filtros.capacidad,
            setCapacidad: (valor) => actualizarFiltro('capacidad', valor),
            precioMin: filtros.precio_min,
            setPrecioMin: (valor) => actualizarFiltro('precio_min', valor),
            precioMax: filtros.precio_max,
            setPrecioMax: (valor) => actualizarFiltro('precio_max', valor),
            busqueda: filtros.busqueda,
            setBusqueda: (valor) => actualizarFiltro('busqueda', valor),
        },

        // Datos filtrados
        datos: {
            habitacionesFiltradas: habitaciones,
            capacidadesDisponibles: [2, 3, 4, 5, 6],
        },

        // Acciones disponibles
        acciones: {
            limpiarFiltros,
            hayFiltrosActivos,
        },
    };
}
