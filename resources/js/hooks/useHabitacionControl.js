import { useState, useEffect } from 'react';
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

export function useHabitacionControl(habitaciones = []) {
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todos');
    const [filtroPrecioMin, setFiltroPrecioMin] = useState('');
    const [filtroPrecioMax, setFiltroPrecioMax] = useState('');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const debouncedBusqueda = useDebounce(filtroBusqueda, 500);

    useEffect(() => {
        const filtrosActivos = {
            estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
            tipo: filtroTipo !== 'todos' ? filtroTipo : undefined,
            capacidad: filtroCapacidad !== 'todos' ? filtroCapacidad : undefined,
            precio_min: filtroPrecioMin || undefined,
            precio_max: filtroPrecioMax || undefined,
            busqueda: debouncedBusqueda || undefined
        };

        router.get(route('panel'), filtrosActivos, { preserveState: true, preserveScroll: true, only: ['habitaciones'], replace: true
        });
    }, [filtroEstado, filtroTipo, filtroCapacidad, filtroPrecioMin, filtroPrecioMax, debouncedBusqueda]);

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
            only: ['habitaciones']
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
            capacidadesDisponibles: [2, 3, 4, 5, 6]
        },
        acciones: {
            limpiarFiltros
        }
    };
}
