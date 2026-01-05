import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import useRetraso from './useRetraso';
import { useSincronizarFiltros } from './useSincronizarFiltros';

export const useClienteControl = (clientes = []) => {
    const inicial = { tipo_documento: 'todos', busqueda: '' };
    const { filtros, actualizarFiltro, limpiarFiltros } = useSincronizarFiltros( inicial, 'panel', ['clientes', 'clientesFiltrados']);

    const busquedaRetrasada = useRetraso(filtros.busqueda, 500);

    useEffect(() => {
        router.get( route('panel'), {
                tipo_documento:
                    filtros.tipo_documento !== 'todos' ? filtros.tipo_documento : undefined, busqueda: busquedaRetrasada || undefined},
                    {preserveState: true, preserveScroll: true, only: ['clientes', 'clientesFiltrados'], replace: true}); },
                    [filtros.tipo_documento, busquedaRetrasada]);

    return {
        filtros: {
            documento: filtros.tipo_documento,
            setDocumento: (v) => actualizarFiltro('tipo_documento', v),
            busqueda: filtros.busqueda,
            setBusqueda: (v) => actualizarFiltro('busqueda', v),
        },
        datos: { clientesFiltrados: clientes},
        acciones: { limpiarFiltros }
    };
};
