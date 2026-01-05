import EditCliente from '@/Components/clientes/formulario/EditCliente';
import { useClienteControl } from '@/hooks/useClienteControl';
import {
EyeIcon,
FunnelIcon,
InboxIcon,
MagnifyingGlassIcon,
PencilIcon,
StarIcon,
ChevronLeftIcon,
ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useState, useMemo } from 'react';

export default function IndexCliente({
clientes = [],
users = [],
clientesFiltrados = [],
}) {
const [clienteEditar, setClienteEditar] = useState(null);
const [drawerAbierto, setDrawerAbierto] = useState(false);
const [paginaActual, setPaginaActual] = useState(1);
const itemsPorPagina = 10;

const { filtros, acciones } = useClienteControl(clientesFiltrados);

const todosLosRegistros = clientesFiltrados;

const abrirEdicion = (cliente) => {
setClienteEditar(cliente);
setDrawerAbierto(true);
};

const cerrarEdicion = () => {
setDrawerAbierto(false);
setTimeout(() => setClienteEditar(null), 300);
};

const obtenerColorDocumento = (tipo_documento) => {
switch (tipo_documento) {
case 'dni':
return 'badge-success';
case 'pasaporte':
return 'badge-warning';
case 'tie':
return 'badge-info';
default:
return 'badge-neutral';
}
};

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
        <div className="mb-6 flex flex-col items-center gap-4 lg:flex-row">
            <div className="relative flex-1">
                <MagnifyingGlassIcon
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input type="text" className="input-bordered input w-full pl-11" value={filtros.busqueda}
                    placeholder="Nombre, email, documento o teléfono..." onChange={(e)=>
                filtros.setBusqueda(e.target.value)}
                />
            </div>
            <select className="select-bordered select w-full max-w-xs lg:w-auto" value={filtros.documento}
                onChange={(e)=> filtros.setDocumento(e.target.value)}
                >
                <option value="todos">Todos los documentos</option>
                <option value="dni">DNI</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="tie">TIE</option>
            </select>
            <button type="button" onClick={acciones.limpiarFiltros}
                className="btn btn-info btn-outline hover:btn-info">
                <FunnelIcon className="mr-2 h-4 w-4" /> Limpiar filtros
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
                    <button onClick={acciones.limpiarFiltros} className="btn btn-primary btn-sm mt-4">
                        Limpiar filtros
                    </button>
                </div>
            </div>
            ) : (
            <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="overflow-x-auto p-4">
                    <table className="table-compact table-pro table w-full">
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
                className="flex flex-col items-center justify-between gap-6 border-t border-gray-200 bg-gris px-6 py-6 sm:flex-row">
                <div className="text-sm font-medium text-gray-700">
                    <span className="font-semibold text-primary">{inicio + 1}</span>
                    <span className="mx-1 text-gray-500">a</span>
                    <span className="font-semibold text-primary">{Math.min(fin, todosLosRegistros.length)}</span>
                    <span className="mx-1 text-gray-500">de</span>
                    <span className="font-semibold text-primary">{todosLosRegistros.length}</span>
                    <span className="ml-1 text-gray-600">cliente{todosLosRegistros.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={irAPaginaAnterior} disabled={paginaActual===1}
                        className="btn btn-sm gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400"
                        title="Página anterior">
                        <ChevronLeftIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <div className="flex items-center gap-1 rounded-lg bg-white p-2 shadow-sm">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                        <button key={pagina} onClick={()=> setPaginaActual(pagina)}
                            className={`btn btn-xs px-3 transition-all ${
                            paginaActual === pagina
                            ? 'border-0 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                            : 'border-0 bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            >
                            {pagina}
                        </button>
                        ))}
                    </div>

                    <button onClick={irAProximaPagina} disabled={paginaActual===totalPaginas}
                        className="btn btn-sm gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400"
                        title="Próxima página">
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
            )}
        </div>

        <EditCliente cliente={clienteEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion} />
    </>
    );
    }
