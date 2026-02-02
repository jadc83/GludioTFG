import EditHabitacion from '@/Components/habitaciones/formulario/EditHabitacion';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { InboxIcon, PencilIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

export default function IndexHabitacion({ habitaciones = [] }) {
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

    const abrirEdicion = (habitacion) => {
        setHabitacionEditar(habitacion);
        setDrawerAbierto(true);
    };

    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setHabitacionEditar(null), 300);
    };

    // --- MAPEO DE ESTADOS PROFESIONAL ---
    const configEstado = {
        disponible: {
            clase: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            label: 'Disponible',
        },
        ocupada: {
            clase: 'bg-rose-50 text-rose-700 border-rose-100',
            label: 'Ocupada',
        },
        mantenimiento: {
            clase: 'bg-amber-50 text-amber-700 border-amber-100',
            label: 'Mantenimiento',
        },
        limpieza: {
            clase: 'bg-sky-50 text-sky-700 border-sky-100',
            label: 'Limpieza',
        },
        default: {
            clase: 'bg-gray-50 text-gray-500 border-gray-100',
            label: 'Desconocido',
        },
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
        <div className="space-y-6">
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
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-8">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                            {habitaciones.length === 0
                                ? 'Inventario Vacío'
                                : 'Sin resultados'}
                        </h3>
                        <p className="mt-2 max-w-xs text-sm text-gray-400">
                            {habitaciones.length === 0
                                ? 'No hay habitaciones registradas en el sistema.'
                                : 'No hay habitaciones que coincidan con los filtros aplicados.'}
                        </p>
                        {habitaciones.length > 0 && (
                            <button
                                onClick={limpiarFiltros}
                                className="mt-6 text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Identificador
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Capacidad
                                        </th>
                                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Estado Actual
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Descripción / Notas
                                        </th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Gestión
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {habitacionesPaginadas.map((hab) => {
                                        const estado =
                                            configEstado[hab.estado] ||
                                            configEstado.default;
                                        return (
                                            <tr
                                                key={hab.id}
                                                className="group transition-colors hover:bg-gray-50/50"
                                            >
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200">
                                                            <span className="font-mono text-lg font-black">
                                                                {hab.numero}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="block text-sm font-black uppercase tracking-tight text-gray-900">
                                                        {hab.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-1.5 text-gray-400">
                                                        <UsersIcon className="h-3 w-3" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">
                                                            {hab.capacidad}{' '}
                                                            plazas
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${estado.clase}`}
                                                    >
                                                        <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                                                        {estado.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="line-clamp-2 max-w-xs text-xs italic leading-relaxed text-gray-500">
                                                        {hab.descripcion ||
                                                            'Sin especificaciones técnicas.'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <button
                                                        onClick={() =>
                                                            abrirEdicion(hab)
                                                        }
                                                        className="inline-flex items-center justify-center rounded-xl bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202] group-hover:scale-110"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

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
