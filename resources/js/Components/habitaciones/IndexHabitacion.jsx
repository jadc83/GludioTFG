import EditHabitacion from '@/Components/habitaciones/formulario/EditHabitacion';
import { InboxIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';

export default function IndexHabitacion({ habitaciones = [] }) {
    const [habitacionEditar, setHabitacionEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    useEffect(() => { setPaginaActual(1); }, [habitaciones.length]);

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
        disponible: { clase: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Disponible' },
        ocupada: { clase: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Ocupada' },
        mantenimiento: { clase: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Mantenimiento' },
        limpieza: { clase: 'bg-sky-50 text-sky-700 border-sky-100', label: 'Limpieza' },
        default: { clase: 'bg-gray-50 text-gray-500 border-gray-100', label: 'Desconocido' }
    };

    const { habitacionesPaginadas, totalPaginas, inicio, fin } = useMemo(() => {
        const totalPaginas = Math.ceil(habitaciones.length / itemsPorPagina);
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const habitacionesPaginadas = habitaciones.slice(inicio, fin);
        return { habitacionesPaginadas, totalPaginas, inicio, fin };
    }, [habitaciones, paginaActual]);

    return (
        <div className="space-y-6">
            {/* --- CONTENEDOR PRINCIPAL --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {habitaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="bg-gray-50 p-8 rounded-full mb-4">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Inventario Vacío</h3>
                        <p className="text-sm text-gray-400 mt-2 max-w-xs">No hay habitaciones registradas en el sistema todavía.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identificador</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tipo y Capacidad</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Estado Actual</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Descripción / Notas</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Gestión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {habitacionesPaginadas.map((hab) => {
                                        const estado = configEstado[hab.estado] || configEstado.default;
                                        return (
                                            <tr key={hab.id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                                                            <span className="font-mono text-lg font-black">{hab.numero}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Room ID: {hab.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div>
                                                        <span className="block font-black text-gray-900 uppercase text-sm tracking-tight">{hab.tipo}</span>
                                                        <div className="flex items-center gap-1.5 mt-1 text-gray-400">
                                                            <UsersIcon className="h-3 w-3" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">{hab.capacidad} plazas</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${estado.clase}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                                                        {estado.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-xs text-gray-500 max-w-xs line-clamp-2 leading-relaxed italic">
                                                        {hab.descripcion || 'Sin especificaciones técnicas.'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <button
                                                        onClick={() => abrirEdicion(hab)}
                                                        className="inline-flex items-center justify-center p-3 bg-gray-50 text-gray-400 hover:text-[#7a0202] hover:bg-red-50 rounded-xl transition-all group-hover:scale-110 shadow-sm"
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

                        {/* --- PAGINACIÓN INDUSTRIAL --- */}
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                Registro <span className="text-gray-900">{inicio + 1}</span> — <span className="text-gray-900">{Math.min(fin, habitaciones.length)}</span> <span className="mx-2 text-gray-200">|</span> Total <span className="text-gray-900">{habitaciones.length}</span> Unidades
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                    disabled={paginaActual === 1}
                                    className="p-2 bg-white border border-gray-200 rounded-xl hover:text-[#7a0202] disabled:opacity-30 transition shadow-sm"
                                >
                                    <ChevronLeftIcon className="h-5 w-5" />
                                </button>

                                <div className="flex gap-1.5">
                                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                                        <button
                                            key={pagina}
                                            onClick={() => setPaginaActual(pagina)}
                                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                                paginaActual === pagina
                                                ? 'bg-[#7a0202] text-white shadow-lg shadow-red-100 scale-110'
                                                : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pagina}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                    disabled={paginaActual === totalPaginas}
                                    className="p-2 bg-white border border-gray-200 rounded-xl hover:text-[#7a0202] disabled:opacity-30 transition shadow-sm"
                                >
                                    <ChevronRightIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <EditHabitacion habitacion={habitacionEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion}/>
        </div>
    );
}
