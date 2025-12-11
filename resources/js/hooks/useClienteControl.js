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
export const useClienteControl = (clientes = [], estadisticas = {}) => {
    const [filtroDocumento, setFiltroDocumento] = useState('todos');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const debouncedBusqueda = useDebounce(filtroBusqueda, 500);

    useEffect(() => {
        router.get(route('panel'), {
            tipo_documento: filtroDocumento !== 'todos' ? filtroDocumento : undefined,
            busqueda: debouncedBusqueda || undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['clientes', 'clientesFiltrados', 'clientesEstadisticas'],
            replace: true
        });
    }, [filtroDocumento, debouncedBusqueda]);

    const aplicarFiltros = () => {
        router.get(route('panel'), {
            tipo_documento: filtroDocumento !== 'todos' ? filtroDocumento : undefined,
            busqueda: filtroBusqueda || undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['clientes', 'clientesFiltrados', 'clientesEstadisticas']
        });
    };

    const limpiarFiltros = () => {
        setFiltroDocumento('todos');
        setFiltroBusqueda('');

        router.get(route('panel'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['clientes', 'clientesFiltrados', 'clientesEstadisticas']
        });
    };

    return {
        filtros: {
            documento: filtroDocumento,
            setDocumento: setFiltroDocumento,
            busqueda: filtroBusqueda,
            setBusqueda: setFiltroBusqueda
        },
        datos: {
            clientesFiltrados: clientes,
            estadisticas
        },
        acciones: {
            aplicarFiltros,
            limpiarFiltros
        }
    };
};
