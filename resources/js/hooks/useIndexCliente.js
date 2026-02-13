import { useEffect, useMemo, useState } from 'react';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';

export default function useIndexCliente({ clientes = [], users = [], clientesFiltrados = [] } = {}) {
    const [clienteEditar, setClienteEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { tipo_documento: 'todos', busqueda: '' },
        'panel',
        ['clientes', 'clientesFiltrados'],
    );

    // Preferir la lista filtrada si viene del servidor; en caso contrario,
    // usar `clientes` y como fallback `users` para mantener compatibilidad
    const todosLosRegistros = (Array.isArray(clientesFiltrados) && clientesFiltrados.length > 0)
        ? clientesFiltrados
        : (Array.isArray(clientes) && clientes.length > 0)
            ? clientes
            : (Array.isArray(users) ? users : []);

    useEffect(() => {
        setPaginaActual(1);
    }, [todosLosRegistros.length, filtros.tipo_documento, filtros.busqueda]);

    const abrirEdicion = (cliente) => {
        setClienteEditar(cliente);
        setDrawerAbierto(true);
    };
    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setClienteEditar(null), 300);
    };

    const { clientesPaginados, totalPaginas, inicio, fin } = useMemo(() => {
        const totalPaginas = Math.ceil(todosLosRegistros.length / itemsPorPagina);
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const clientesPaginados = todosLosRegistros.slice(inicio, fin);
        return { clientesPaginados, totalPaginas, inicio, fin };
    }, [todosLosRegistros, paginaActual]);

    const noHayClientesEnAbsoluto = clientes.length === 0 && users.length === 0;

    return {
        clienteEditar,
        drawerAbierto,
        abrirEdicion,
        cerrarEdicion,
        paginaActual,
        setPaginaActual,
        itemsPorPagina,
        filtros,
        actualizarFiltro,
        limpiarFiltros,
        clientesPaginados,
        totalPaginas,
        inicio,
        fin,
        noHayClientesEnAbsoluto,
        todosLosRegistros,
    };
}
