import EditCliente from '@/Components/clientes/formulario/EditCliente';
import Campo from '@/Components/formulario/Campo';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { obtenerColorDocumento, obtenerNombreDocumento } from '@/utils/formatters';
import { EyeIcon, FunnelIcon, InboxIcon, MagnifyingGlassIcon, PencilIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';

export default function IndexCliente({ clientes = [], users = [], clientesFiltrados = [] }) {
    const [clienteEditar, setClienteEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { tipo_documento: 'todos', busqueda: '' }, 'panel', ['clientes', 'clientesFiltrados']
    );

    const todosLosRegistros = clientesFiltrados;

    useEffect(() => { setPaginaActual(1); }, [todosLosRegistros.length, filtros.tipo_documento, filtros.busqueda]);

    const abrirEdicion = (cliente) => { setClienteEditar(cliente); setDrawerAbierto(true); };
    const cerrarEdicion = () => { setDrawerAbierto(false); setTimeout(() => setClienteEditar(null), 300); };

    // --- LÓGICA DE PAGINACIÓN ---
    const { clientesPaginados, totalPaginas, inicio, fin } = useMemo(() => {
        const totalPaginas = Math.ceil(todosLosRegistros.length / itemsPorPagina);
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const clientesPaginados = todosLosRegistros.slice(inicio, fin);
        return { clientesPaginados, totalPaginas, inicio, fin };
    }, [todosLosRegistros, paginaActual]);

    const irAProximaPagina = () => { if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1); };
    const irAPaginaAnterior = () => { if (paginaActual > 1) setPaginaActual(paginaActual - 1); };

    const noHayClientesEnAbsoluto = clientes.length === 0 && users.length === 0;

    return (
        <div className="space-y-6">
            {/* --- CABECERA --- */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        Gestión de <span className="text-[#7a0202]">Clientes</span>
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Directorio y gestión de clientes</p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <InboxIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- BARRA DE FILTROS (Panel de Control) --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        className="w-full bg-gray-50 border-none rounded-xl pl-12 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7a0202]/10 transition"
                        placeholder="Buscar por nombre, email o documento..."
                        value={filtros.busqueda}
                        onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                    />
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <select
                        className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                        value={filtros.tipo_documento}
                        onChange={(e) => actualizarFiltro('tipo_documento', e.target.value)}
                    >
                        <option value="todos">Todos los documentos</option>
                        <option value="dni">DNI</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="tie">TIE</option>
                    </select>

                    <button
                        onClick={limpiarFiltros}
                        className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition"
                        title="Limpiar filtros"
                    >
                        <FunnelIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* --- CONTENEDOR DE TABLA --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {noHayClientesEnAbsoluto || todosLosRegistros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-4">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No se encontraron clientes</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs">Ajusta los filtros o crea un nuevo registro para comenzar.</p>
                        {todosLosRegistros.length === 0 && !noHayClientesEnAbsoluto && (
                            <button onClick={limpiarFiltros} className="mt-6 text-[#7a0202] font-black text-xs uppercase tracking-widest hover:underline">Limpiar Búsqueda</button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 align-middle text-center">Cliente</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 align-middle text-center">Documento</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 align-middle text-center">Contacto</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 align-middle text-center">Nacionalidad</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 align-middle text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {clientesPaginados.map((cliente) => (
                                        <tr key={`${cliente.tipo_usuario}-${cliente.id}`} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5 align-middle text-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs">
                                                        {cliente.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-black text-gray-900 uppercase text-sm tracking-tight">{cliente.name}</span>
                                                            {cliente.tipo_usuario === 'usuario' && <StarIcon className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-400">{cliente.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-middle text-center">
                                                {cliente.tipo_documento ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-[#7a0202] uppercase leading-none mb-1">{cliente.tipo_documento}</span>
                                                        <span className="font-mono text-sm font-medium text-gray-700 tracking-tighter">{cliente.numero_documento}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase">Sin Documento</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 align-middle text-center">
                                                <div className="text-sm font-bold text-gray-700">{cliente.telefono || '—'}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold truncate max-w-[150px]">{cliente.direccion || 'No hay dirección'}</div>
                                            </td>
                                            <td className="px-6 py-5 align-middle text-center">
                                                <span className="inline-block px-2 py-1 bg-gray-100 rounded text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                                    {cliente.nacionalidad || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 align-middle text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                                        <EyeIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => abrirEdicion(cliente)}
                                                        className="p-2 bg-gray-50 text-gray-400 hover:text-[#7a0202] hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- PAGINACIÓN (Footer de Tabla) --- */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Mostrando <span className="text-gray-900">{inicio + 1}</span> a <span className="text-gray-900">{Math.min(fin, todosLosRegistros.length)}</span> de <span className="text-gray-900">{todosLosRegistros.length}</span> Clientes
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={irAPaginaAnterior}
                                    disabled={paginaActual === 1}
                                    className="p-2 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                                >
                                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                                </button>

                                <div className="flex items-center px-4">
                                    <span className="text-xs font-black text-gray-900 uppercase">Página {paginaActual} <span className="text-gray-300 mx-1">/</span> {totalPaginas}</span>
                                </div>

                                <button
                                    onClick={irAProximaPagina}
                                    disabled={paginaActual === totalPaginas}
                                    className="p-2 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                                >
                                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <EditCliente cliente={clienteEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion} />
        </div>
    );
}
