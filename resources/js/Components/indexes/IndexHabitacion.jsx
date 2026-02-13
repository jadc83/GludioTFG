import EditHabitacion from '@/Components/formularios/edit/EditHabitacion';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { InboxIcon } from '@heroicons/react/24/outline';
import EmptyStateHabitaciones from '@/Components/indexes/EmptyStateHabitaciones';
import HabitacionesTable from '@/Components/indexes/HabitacionesTable';
import { useEffect, useMemo, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

export default function IndexHabitacion({ habitaciones = [] }) {
    // Aceptar tanto un array puro como una respuesta paginada (ej. { data: [] })
    const habitacionesArray = Array.isArray(habitaciones)
        ? habitaciones
        : Array.isArray(habitaciones?.data)
        ? habitaciones.data
        : [];
    const [habitacionEditar, setHabitacionEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { busqueda: '', estado: 'todos', tipo: 'todos' },
        'panel',
        ['habitaciones'],
    );

    useEffect(() => {
        setPaginaActual(1);
    }, [habitaciones.length, filtros.busqueda, filtros.estado, filtros.tipo]);

    // Suscripción a broadcasts para actualizar la vista en otras pestañas
    useEffect(() => {
        if (!window?.Echo) return;

        const channel = window.Echo.private('habitaciones');

        const handler = () => {
            Inertia.reload();
        };

        channel.listen('HabitacionUpdated', handler);

        return () => {
            try {
                channel.stopListening('HabitacionUpdated');
                window.Echo.leave('habitaciones');
            } catch (e) {
                // ignorar errores en cleanup
            }
        };
    }, []);

    const abrirEdicion = (habitacion) => {
        setHabitacionEditar(habitacion);
        setDrawerAbierto(true);
    };

    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setHabitacionEditar(null), 300);
    };



    const {
        habitacionesPaginadas,
        habitacionesFiltradas,
        totalPaginas,
        inicio,
        fin,
    } = useMemo(() => {
        // Aplicar filtros
        const filtradas = habitaciones.filter((hab) => {
            // Filtro de búsqueda
            if (filtros.busqueda) {
                const q = filtros.busqueda.toLowerCase();
                const coincide = [hab.numero, hab.tipo, hab.descripcion].some(
                    (field) =>
                        (field || '').toString().toLowerCase().includes(q),
                );
                if (!coincide) return false;
            }

            // Filtro de estado
            if (filtros.estado && filtros.estado !== 'todos') {
                if (hab.estado !== filtros.estado) return false;
            }

            // Filtro de tipo
            if (filtros.tipo && filtros.tipo !== 'todos') {
                if (hab.tipo !== filtros.tipo) return false;
            }

            return true;
        });

        const totalPaginas = Math.ceil(filtradas.length / itemsPorPagina);
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const habitacionesPaginadas = filtradas.slice(inicio, fin);
        return {
            habitacionesPaginadas,
            habitacionesFiltradas: filtradas,
            totalPaginas,
            inicio,
            fin,
        };
    }, [habitaciones, paginaActual, filtros]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Habitaciones"
                subtitulo="Inventario y control de habitaciones"
            />

            {/* Barra de filtros */}
            <BarraBuscador
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Buscar por número, tipo o descripción..."
                filtrosAdicionales={[
                    {
                        tipo: 'select',
                        nombre: 'estado',
                        opciones: [
                            { valor: 'todos', etiqueta: 'Todos los estados' },
                            { valor: 'disponible', etiqueta: 'Disponible' },
                            { valor: 'ocupada', etiqueta: 'Ocupada' },
                            {
                                valor: 'mantenimiento',
                                etiqueta: 'Mantenimiento',
                            },
                            { valor: 'limpieza', etiqueta: 'Limpieza' },
                        ],
                    },
                    {
                        tipo: 'select',
                        nombre: 'tipo',
                        opciones: [
                            { valor: 'todos', etiqueta: 'Todos los tipos' },
                            { valor: 'individual', etiqueta: 'Individual' },
                            { valor: 'doble', etiqueta: 'Doble' },
                            { valor: 'suite', etiqueta: 'Suite' },
                            { valor: 'familiar', etiqueta: 'Familiar' },
                        ],
                    },
                ]}
            />

            {/* --- CONTENEDOR PRINCIPAL --- */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                {habitacionesFiltradas.length === 0 ? (
                    <EmptyStateHabitaciones count={habitacionesArray.length} onLimpiar={limpiarFiltros} />
                ) : (
                    <>
                        <HabitacionesTable habitaciones={habitacionesPaginadas} abrirEdicion={abrirEdicion} />

                        {/* Paginación */}
                        <Paginacion
                            paginaActual={paginaActual}
                            totalPaginas={totalPaginas}
                            inicio={inicio}
                            fin={fin}
                            total={habitacionesFiltradas.length}
                            onCambiarPagina={setPaginaActual}
                            etiqueta="Habitaciones"
                        />
                    </>
                )}
            </div>

            <EditHabitacion
                habitacion={habitacionEditar}
                abierto={drawerAbierto}
                onCerrar={cerrarEdicion}
            />
        </div>
    );
}
