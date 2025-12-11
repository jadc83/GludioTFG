import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useHabitacionControl(habitaciones = [], estadisticas = {}) {
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todos');
    const [filtroPrecioMin, setFiltroPrecioMin] = useState('');
    const [filtroPrecioMax, setFiltroPrecioMax] = useState('');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const debouncedBusqueda = useDebounce(filtroBusqueda, 500);

    const dataChart = useMemo(() => {
        return [{
            name: 'Total',
            disponible: estadisticas.disponible || 0,
            ocupada: estadisticas.ocupada || 0,
            mantenimiento: estadisticas.mantenimiento || 0,
            limpieza: estadisticas.limpieza || 0,
        }];
    }, [estadisticas]);

    const capacidadesDisponibles = estadisticas.capacidades_disponibles || [];

    useEffect(() => {
        const filtrosActivos = {
            estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
            tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
            capacidad: filtroCapacidad !== 'todos' ? filtroCapacidad : undefined,
            precio_min: filtroPrecioMin || undefined,
            precio_max: filtroPrecioMax || undefined,
            busqueda: debouncedBusqueda || undefined
        };

        router.get(route('panel'), filtrosActivos, {
            preserveState: true,
            preserveScroll: true,
            only: ['habitaciones', 'habitacionesEstadisticas'],
            replace: true
        });
    }, [filtroEstado, filtroTipo, filtroCapacidad, filtroPrecioMin, filtroPrecioMax, debouncedBusqueda]);

    const aplicarFiltros = () => {
        router.get(route('panel'), {
            estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
            tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
            capacidad: filtroCapacidad !== 'todos' ? filtroCapacidad : undefined,
            precio_min: filtroPrecioMin || undefined,
            precio_max: filtroPrecioMax || undefined,
            busqueda: filtroBusqueda || undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['habitaciones', 'habitacionesEstadisticas']
        });
    };

    const limpiarFiltros = () => {
        setFiltroEstado('todos');
        setFiltroTipo('todos');
        setFiltroCapacidad('todos');
        setFiltroPrecioMin('');
        setFiltroPrecioMax('');
        setFiltroBusqueda('');

        router.get(route('panel'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['habitaciones', 'habitacionesEstadisticas']
        });
    };

    return {
        filtros: {
            estado: filtroEstado, setEstado: setFiltroEstado,
            tipo: filtroTipo, setTipo: setFiltroTipo,
            capacidad: filtroCapacidad, setCapacidad: setFiltroCapacidad,
            precioMin: filtroPrecioMin, setPrecioMin: setFiltroPrecioMin,
            precioMax: filtroPrecioMax, setPrecioMax: setFiltroPrecioMax,
            busqueda: filtroBusqueda, setBusqueda: setFiltroBusqueda,
        },
        datos: {
            habitacionesFiltradas: habitaciones,
            capacidadesDisponibles,
            conteos: estadisticas,
            dataChart
        },
        acciones: {
            aplicarFiltros,
            limpiarFiltros
        }
    };
}
