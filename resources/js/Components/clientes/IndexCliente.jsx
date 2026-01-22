import EditCliente from '@/Components/clientes/formulario/EditCliente';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { obtenerColorDocumento, obtenerNombreDocumento } from '@/utils/formatters';
import { EyeIcon, FunnelIcon, InboxIcon, MagnifyingGlassIcon, PencilIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
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

/**
 * Resetea la paginación cuando cambian los filtros o datos
 */
useEffect(() => { setPaginaActual(1); }, [todosLosRegistros.length, filtros.tipo_documento, filtros.busqueda]);
    const abrirEdicion = (cliente) => { setClienteEditar(cliente); setDrawerAbierto(true); };
    const cerrarEdicion = () => { setDrawerAbierto(false); setTimeout(() => setClienteEditar(null), 300);};

    // Paginacion
    const { clientesPaginados, totalPaginas, inicio, fin } = useMemo(() => {
    const totalPaginas = Math.ceil(todosLosRegistros.length / itemsPorPagina);
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const clientesPaginados = todosLosRegistros.slice(inicio, fin);
    return { clientesPaginados, totalPaginas, inicio, fin };
    }, [todosLosRegistros, paginaActual]);

const irAProximaPagina = () => {
if (paginaActual < totalPaginas) { setPaginaActual(paginaActual + 1); } }; const irAPaginaAnterior=()=> {
    if (paginaActual > 1) {
    setPaginaActual(paginaActual - 1);
    }
    };

    const noHayClientesEnAbsoluto = clientes.length === 0 && users.length === 0;

    return (
    <>
        <div className="mb-4 flex flex-col items-stretch gap-2 md:items-center md:flex-row md:gap-3">
            <div className="relative flex-1">
                <MagnifyingGlassIcon
                    className="absolute left-3 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 transform text-gray-400" />
                <input type="text" className="input input-bordered w-full pl-10 text-sm md:text-base" value={filtros.busqueda} placeholder="Nombre, email, documento..."
                    onChange={(e) => actualizarFiltro('busqueda', e.target.value)}/>
            </div>
            <select className="select select-bordered w-full md:max-w-xs text-sm md:text-base" value={filtros.tipo_documento}
                onChange={(e) => actualizarFiltro('tipo_documento', e.target.value)}>
                <option value="todos">Todos los documentos</option>
                <option value="dni">DNI</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="tie">TIE</option>
            </select>
            <button type="button" onClick={limpiarFiltros} className="btn btn-info btn-outline btn-sm md:btn-md w-full md:w-auto hover:btn-info">
                <FunnelIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Limpiar filtros</span>
            </button>
        </div>

        <div className="table-pro-wrapper">
            {noHayClientesEnAbsoluto ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <InboxIcon className="h-24 w-24 text-gray-300" />
                <div className="text-center">
                    <p className="mb-2 text-xl font-semibold text-gray-600">
                        No hay clientes registrados
                    </p>
                    <p className="text-gray-400">
                        Crea un nuevo cliente para comenzar
                    </p>
                </div>
            </div>
            ) : todosLosRegistros.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <InboxIcon className="h-24 w-24 text-gray-300" />
                <div className="text-center">
                    <p className="mb-2 text-xl font-semibold text-gray-600">
                        No se encontraron clientes
                    </p>
                    <p className="text-gray-400">
                        Intenta cambiar los filtros de búsqueda
                    </p>
                    <button
                        onClick={limpiarFiltros}
                        className="btn btn-primary btn-sm mt-4"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>
            ) : (
            <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="overflow-x-auto p-2 md:p-4">
                    <table className="table table-zebra table-compact w-full text-xs md:text-sm">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Documento</th>
                                <th>Teléfono</th>
                                <th>Nacionalidad</th>
                                <th>Dirección</th>
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientesPaginados.map((cliente) => (
                            <tr key={`${cliente.tipo_usuario}-${cliente.id}`} className="hover">
                                <td className="font-semibold">
                                    <div className="flex items-center gap-2">
                                        {cliente.tipo_usuario === 'usuario' && ( <StarIcon className="h-4 w-4 fill-yellow-500 text-yellow-500" />)}
                                        <span>{cliente.name}</span>
                                    </div>
                                </td>
                                <td className="font-mono text-sm">
                                    {cliente.email}
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        {cliente.tipo_documento ? (
                                        <>
                                            <span className={`badge ${obtenerColorDocumento(cliente.tipo_documento)}`}>
                                                {cliente.tipo_documento?.toUpperCase()}
                                            </span>
                                            <span className="font-mono text-sm">
                                                { cliente.numero_documento }
                                            </span>
                                        </>
                                        ) : (
                                        <span className="text-xs italic text-gray-400">
                                            Sin documento
                                        </span>
                                        )}
                                    </div>
                                </td>
                                <td>{cliente.telefono || '-'}</td>
                                <td className="text-center">
                                    <span className="badge badge-outline badge-sm">
                                        {cliente.nacionalidad || 'Sin nacionalidad'}
                                    </span>
                                </td>
                                <td className="max-w-xs">
                                    {cliente.direccion ? cliente.direccion : 'Sin dirección' }
                                </td>
                                <td className="text-sm text-gray-500">
                                    {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td>
                                    <div className="flex gap-1">
                                        <button className="btn btn-ghost btn-outline btn-sm">
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={()=> abrirEdicion( cliente ) }>
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {todosLosRegistros.length > 0 && (
            <div
                className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gris px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 sm:flex-row">
                <div className="text-xs font-medium text-gray-700 md:text-sm">
                    <span className="font-semibold text-primary">{inicio + 1}</span>
                    <span className="mx-1 text-gray-500">a</span>
                    <span className="font-semibold text-primary">{Math.min(fin, todosLosRegistros.length)}</span>
                    <span className="mx-1 text-gray-500">de</span>
                    <span className="font-semibold text-primary">{todosLosRegistros.length}</span>
                    <span className="ml-1 text-gray-600">cliente{todosLosRegistros.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={irAPaginaAnterior} disabled={paginaActual===1} title="Página anterior"
                        className="btn btn-xs md:btn-sm gap-1 md:gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400">
                        <ChevronLeftIcon className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline text-xs md:text-base">Anterior</span>
                    </button>

                    <button onClick={irAProximaPagina} disabled={paginaActual===totalPaginas}
                        className="btn btn-xs md:btn-sm gap-1 md:gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400" title="Próxima página">
                        <span className="hidden sm:inline text-xs md:text-base">Siguiente</span>
                        <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
                    </button>
                </div>
            </div>
            )}
        </div>

        <EditCliente cliente={clienteEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion} />
    </>
    );
    }
