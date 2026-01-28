import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { useState, useMemo, useEffect } from 'react';
import { MagnifyingGlassIcon, InboxIcon, PencilIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function IndexEmpleados({ empleados = [] }) {
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { busqueda: '' }, 'panel', ['empleados']
    );

    useEffect(() => { setPaginaActual(1); }, [empleados.length, filtros.busqueda]);

    const { empleadosPaginados, totalPaginas, inicio, fin } = useMemo(() => {
        const filtrados = empleados.filter(e => {
            const q = filtros.busqueda?.toLowerCase?.() || '';
            if (!q) return true;
            return [e.name, e.email, e.numero_empleado, e.departamento, e.puesto].some(field =>
                (field || '').toString().toLowerCase().includes(q)
            );
        });

        const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itemsPorPagina));
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const empleadosPaginados = filtrados.slice(inicio, fin);
        return { empleadosPaginados, totalPaginas, inicio, fin };
    }, [empleados, paginaActual, filtros.busqueda]);

    const irAProximaPagina = () => { if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1); };
    const irAPaginaAnterior = () => { if (paginaActual > 1) setPaginaActual(paginaActual - 1); };

    return (
        <div className="space-y-6">
            {/* BARRA DE BÚSQUEDA ESTILO HOTEL GLUDIO */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        className="w-full bg-gray-50 border-none rounded-xl pl-12 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7a0202]/10 transition"
                        placeholder="Buscar por nombre, email, número o departamento..."
                        value={filtros.busqueda}
                        onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                    />
                </div>
                <button
                    onClick={limpiarFiltros}
                    className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition"
                    title="Limpiar filtros"
                >
                    <InboxIcon className="h-5 w-5" />
                </button>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {empleadosPaginados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No se encontraron empleados</h3>
                        <p className="text-sm text-gray-400 mt-1">Ajusta los filtros para encontrar lo que buscas.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Empleado</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Número</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Departamento</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Puesto</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {empleadosPaginados.map((e) => (
                                        <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs uppercase">
                                                        {e.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{e.name}</div>
                                                        <div className="text-xs font-mono text-gray-400">{e.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm font-medium text-gray-700">{e.numero_empleado}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-tight">{e.departamento || '—'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 uppercase text-[11px] font-bold">{e.puesto || '—'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><EyeIcon className="h-5 w-5" /></button>
                                                    <button className="p-2 text-gray-400 hover:text-[#7a0202] hover:bg-red-50 rounded-lg transition"><PencilIcon className="h-5 w-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINACIÓN */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Mostrando <span className="text-gray-900">{inicio + 1}</span> a <span className="text-gray-900">{Math.min(fin, empleados.length)}</span> de <span className="text-gray-900">{empleados.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={irAPaginaAnterior} disabled={paginaActual === 1} className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition">
                                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                                </button>
                                <span className="text-xs font-black text-gray-900 uppercase">Página {paginaActual} / {totalPaginas}</span>
                                <button onClick={irAProximaPagina} disabled={paginaActual === totalPaginas} className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition">
                                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
