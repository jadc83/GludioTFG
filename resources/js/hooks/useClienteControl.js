import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import useRetraso from './useRetraso';
import { useSincronizarFiltros } from './useSincronizarFiltros';

export const useClienteControl = (clientes = []) => {
    // Configuración inicial de filtros
    const filtrosIniciales = { tipo_documento: 'todos', busqueda: '' };

    // Utilizar hook para sincronizar filtros con URL
    const {
        filtros,
        actualizarFiltro,
        limpiarFiltros
    } = useSincronizarFiltros(
        filtrosIniciales,
        'panel',
        ['clientes', 'clientesFiltrados']
    );

    // Aplicar retraso de 500ms a las búsquedas para evitar requests excesivas
    const busquedaRetrasada = useRetraso(filtros.busqueda, 500);

    /**
     * Actualizar resultados cuando cambian los filtros
     */
    useEffect(() => {
        router.get(
            route('panel'),
            {
                tipo_documento:
                    filtros.tipo_documento !== 'todos'
                        ? filtros.tipo_documento
                        : undefined,
                busqueda: busquedaRetrasada || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['clientes', 'clientesFiltrados'],
                replace: true,
            }
        );
    }, [filtros.tipo_documento, busquedaRetrasada]);

    return {
        filtros: {
            documento: filtros.tipo_documento,
            setDocumento: (v) => actualizarFiltro('tipo_documento', v),
            busqueda: filtros.busqueda,
            setBusqueda: (v) => actualizarFiltro('busqueda', v),
        },

        datos: {
            clientesFiltrados: clientes,
        },

        acciones: {
            limpiarFiltros,
        },
    };
};
