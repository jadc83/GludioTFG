import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import useRetraso from './useRetraso';
import { useSincronizarFiltros } from './useSincronizarFiltros';

export function useHabitacionControl(habitaciones = []) {
    const initial = {
        estado: 'todos',
        tipo: 'todos',
        capacidad: 'todos',
        precio_min: '',
        precio_max: '',
        busqueda: '',
    };
    const { filtros, actualizarFiltro, limpiarFiltros, hayFiltrosActivos } =
        useSincronizarFiltros(initial, 'panel', ['habitaciones']);

    const busquedaRetrasada = useRetraso(filtros.busqueda, 500);

    useEffect(() => {
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

    // mantener una API similar para limpiarFiltros (ya provisto por useFiltersSync)

    return {
        filtros: {
            estado: filtros.estado,
            setEstado: (v) => actualizarFiltro('estado', v),
            tipo: filtros.tipo,
            setTipo: (v) => actualizarFiltro('tipo', v),
            capacidad: filtros.capacidad,
            setCapacidad: (v) => actualizarFiltro('capacidad', v),
            precioMin: filtros.precio_min,
            setPrecioMin: (v) => actualizarFiltro('precio_min', v),
            precioMax: filtros.precio_max,
            setPrecioMax: (v) => actualizarFiltro('precio_max', v),
            busqueda: filtros.busqueda,
            setBusqueda: (v) => actualizarFiltro('busqueda', v),
        },
        datos: {
            habitacionesFiltradas: habitaciones,
            capacidadesDisponibles: [2, 3, 4, 5, 6],
        },
        acciones: {
            limpiarFiltros,
            hayFiltrosActivos,
        },
    };
}
