import { useState, useMemo } from 'react';

export function useHabitacionControl(habitaciones = []) {
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroCapacidad, setFiltroCapacidad] = useState('todos');
    const [filtroPrecioMin, setFiltroPrecioMin] = useState('');
    const [filtroPrecioMax, setFiltroPrecioMax] = useState('');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const conteos = useMemo(() => {
        return {
            disponible: habitaciones.filter(habitacion => habitacion.estado === 'disponible').length,
            ocupada: habitaciones.filter(habitacion => habitacion.estado === 'ocupada').length,
            mantenimiento: habitaciones.filter(habitacion => habitacion.estado === 'mantenimiento').length,
            limpieza: habitaciones.filter(habitacion => habitacion.estado === 'limpieza').length,
            total: habitaciones.length
        };}, [habitaciones]);

    const dataChart = useMemo(() => {
        return [{
            name: 'Total',
            disponible: conteos.disponible,
            ocupada: conteos.ocupada,
            mantenimiento: conteos.mantenimiento,
            limpieza: conteos.limpieza,
        }];}, [conteos]);

    const habitacionesFiltradas = useMemo(() => {
        const busquedaLower = filtroBusqueda.toLowerCase().trim();

        return habitaciones.filter(habitacion => {
            const cumpleEstado = filtroEstado === 'todos' || habitacion.estado === filtroEstado;
            const cumpleTipo = filtroTipo === 'todos' || habitacion.tipo === filtroTipo;
            const cumpleCapacidad = filtroCapacidad === 'todos' || habitacion.capacidad === parseInt(filtroCapacidad);

            const precioMin = filtroPrecioMin === '' ? 0 : parseFloat(filtroPrecioMin);
            const precioMax = filtroPrecioMax === '' ? Infinity : parseFloat(filtroPrecioMax);
            const cumplePrecio = habitacion.precio_noche >= precioMin && habitacion.precio_noche <= precioMax;

            const cumpleBusqueda = busquedaLower === '' || [
                habitacion.numero?.toString(),
                habitacion.tipo,
                habitacion.descripcion
            ].some(campo =>
                campo &&
                campo.toString().toLowerCase().includes(busquedaLower)
            );

            return cumpleEstado && cumpleTipo && cumpleCapacidad && cumplePrecio && cumpleBusqueda;
                    });}, [habitaciones, filtroEstado, filtroTipo, filtroCapacidad, filtroPrecioMin, filtroPrecioMax, filtroBusqueda]);

    const capacidadesDisponibles = useMemo(() => {
        const caps = [...new Set(habitaciones.map(h => h.capacidad))];
        return caps.sort((a, b) => a - b);
    }, [habitaciones]);

    const limpiarFiltros = () => {
        setFiltroEstado('todos');
        setFiltroTipo('todos');
        setFiltroCapacidad('todos');
        setFiltroPrecioMin('');
        setFiltroPrecioMax('');
        setFiltroBusqueda('');
    };

    return {
        filtros: {
            estado: filtroEstado, setEstado: setFiltroEstado,
            tipo: filtroTipo, setTipo: setFiltroTipo,
            capacidad: filtroCapacidad, setCapacidad: setFiltroCapacidad,
            precioMin: filtroPrecioMin, setPrecioMin: setFiltroPrecioMin,
            precioMax: filtroPrecioMax, setPrecioMax: setFiltroPrecioMax,
            busqueda: filtroBusqueda,  setBusqueda: setFiltroBusqueda,
        }, datos: { habitacionesFiltradas, capacidadesDisponibles, conteos, dataChart }, acciones: { limpiarFiltros }
    };
}
