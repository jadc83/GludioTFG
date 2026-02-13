import { useEffect, useMemo, useState } from 'react';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';

export default function useIndexEmpleados({ empleados = [] } = {}) {
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { busqueda: '' },
        'panel',
        ['empleados'],
    );

    useEffect(() => {
        setPaginaActual(1);
    }, [empleados.length, filtros.busqueda]);

    const { empleadosPaginados, totalPaginas, inicio, fin } = useMemo(() => {
        const filtrados = (empleados || []).filter((e) => {
            const q = filtros.busqueda?.toLowerCase?.() || '';
            if (!q) return true;
            return [e.name, e.email, e.departamento].some((field) =>
                (field || '').toString().toLowerCase().includes(q),
            );
        });

        const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itemsPorPagina));
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const empleadosPaginados = filtrados.slice(inicio, fin);
        return { empleadosPaginados, totalPaginas, inicio, fin };
    }, [empleados, paginaActual, filtros.busqueda]);

    // Drawer / edición / detalle
    const [empleadoEditar, setEmpleadoEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [empleadoDetalle, setEmpleadoDetalle] = useState(null);
    const [detalleAbierto, setDetalleAbierto] = useState(false);

    const abrirEdicion = (emp) => {
        setEmpleadoEditar(emp);
        setDrawerAbierto(true);
    };
    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setEmpleadoEditar(null), 300);
    };

    const abrirDetalle = (emp) => {
        setEmpleadoDetalle(emp);
        setDetalleAbierto(true);
    };
    const cerrarDetalle = () => {
        setDetalleAbierto(false);
        setEmpleadoDetalle(null);
    };

    return {
        paginaActual,
        setPaginaActual,
        itemsPorPagina,
        filtros,
        actualizarFiltro,
        limpiarFiltros,
        empleadosPaginados,
        totalPaginas,
        inicio,
        fin,
        empleadoEditar,
        abrirEdicion,
        cerrarEdicion,
        drawerAbierto,
        detalleAbierto,
        empleadoDetalle,
        abrirDetalle,
        cerrarDetalle,
    };
}
