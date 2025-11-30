// resources/js/hooks/useClientesControl.js
import { useState, useMemo } from 'react';

export const useClientesControl = (clientes = []) => {
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const conteos = useMemo(() => {
        return {
            activo: clientes.filter(cliente => cliente.estado === 'activo').length,
            inactivo: clientes.filter(cliente => cliente.estado === 'inactivo').length,
            total: clientes.length
        };
    }, [clientes]);

    const clientesFiltrados = useMemo(() => {
        return clientes.filter(cliente => {
            const cumpleEstado = filtroEstado === 'todos' || cliente.estado === filtroEstado;
            const cumpleBusqueda = filtroBusqueda === '' ||
                cliente.nombre?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                cliente.email?.toLowerCase().includes(filtroBusqueda.toLowerCase());

            return cumpleEstado && cumpleBusqueda;
        });
    }, [clientes, filtroEstado, filtroBusqueda]);

    const limpiarFiltros = () => {
        setFiltroEstado('todos');
        setFiltroBusqueda('');
    };

    return {
        filtros: { estado: filtroEstado, setEstado: setFiltroEstado, busqueda: filtroBusqueda, setBusqueda: setFiltroBusqueda},
        datos: { clientesFiltrados, conteos },
        acciones: { limpiarFiltros }
    };
};
