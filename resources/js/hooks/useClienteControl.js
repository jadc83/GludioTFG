import { useState, useMemo } from 'react';

export const useClienteControl = (clientes = []) => {
    const [filtroDocumento, setFiltroDocumento] = useState('todos');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const conteos = useMemo(() => {
        return {
            dni: clientes.filter(cliente => cliente.tipo_documento === 'dni').length,
            pasaporte: clientes.filter(cliente => cliente.tipo_documento === 'pasaporte').length,
            tie: clientes.filter(cliente => cliente.tipo_documento === 'tie').length,
            total: clientes.length
        };
    }, [clientes]);

    const clientesFiltrados = useMemo(() => {
        return clientes.filter(cliente => {
            const cumpleDocumento = filtroDocumento === 'todos' || cliente.tipo_documento === filtroDocumento;
            const cumpleBusqueda = filtroBusqueda === '' ||
                cliente.name?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                cliente.email?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                cliente.numero_documento?.toLowerCase().includes(filtroBusqueda.toLowerCase());

            return cumpleDocumento && cumpleBusqueda;
        });
    }, [clientes, filtroDocumento, filtroBusqueda]);

    const limpiarFiltros = () => {
        setFiltroDocumento('todos');
        setFiltroBusqueda('');
    };

    return {
        filtros: {
            documento: filtroDocumento,
            setDocumento: setFiltroDocumento,
            busqueda: filtroBusqueda,
            setBusqueda: setFiltroBusqueda
        },
        datos: { clientesFiltrados, conteos },
        acciones: { limpiarFiltros }
    };
};
