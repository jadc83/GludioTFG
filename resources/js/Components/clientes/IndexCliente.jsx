import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, InboxIcon, EyeIcon, PencilIcon, StarIcon } from '@heroicons/react/24/outline';
import EditCliente from '@/Components/clientes/formulario/EditCliente';
import CreateCliente from '@/Components/clientes/formulario/CreateCliente';
import { useClienteControl } from '@/hooks/useClienteControl';

export default function IndexCliente({ clientes = [], users = [], clientesFiltrados = [] }) {
    const [clienteEditar, setClienteEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    const { filtros, acciones } = useClienteControl(clientesFiltrados);

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
            case 'dni': return 'badge-success';
            case 'pasaporte': return 'badge-warning';
            case 'tie': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    const todosLosRegistros = clientesFiltrados.length > 0 ? clientesFiltrados : [
        ...clientes.map(c => ({ ...c, tipo_usuario: 'cliente' })),
        ...users.map(u => ({ ...u, tipo_usuario: 'usuario' }))
    ];

    const noHayClientesEnAbsoluto = clientes.length === 0 && users.length === 0;

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <CreateCliente />
            </div>


            <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Nombre, email, documento o teléfono..." className="input input-bordered w-full pl-11"
                        value={filtros.busqueda} onChange={(e) => filtros.setBusqueda(e.target.value)} />
                </div>
                <select className="select select-bordered w-full lg:w-auto max-w-xs" value={filtros.documento} onChange={(e) => filtros.setDocumento(e.target.value)}>
                    <option value="todos">Todos los documentos</option>
                    <option value="dni">DNI</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="tie">TIE</option>
                </select>
                <button
                    type="button"
                    onClick={acciones.limpiarFiltros}
                    className="btn btn-outline btn-info hover:btn-info"
                >
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Limpiar filtros
                </button>
            </div>

            <div className="overflow-x-auto">
                <div className="text-sm text-gray-500 mb-4">
                    Mostrando {todosLosRegistros.length} cliente{todosLosRegistros.length !== 1 ? 's' : ''}
                </div>


                {noHayClientesEnAbsoluto ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <InboxIcon className="w-24 h-24 text-gray-300" />
                        <div className="text-center">
                            <p className="text-gray-600 text-xl font-semibold mb-2">No hay clientes registrados</p>
                            <p className="text-gray-400">Crea un nuevo cliente para comenzar</p>
                        </div>
                    </div>
                ) : todosLosRegistros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <InboxIcon className="w-24 h-24 text-gray-300" />
                        <div className="text-center">
                            <p className="text-gray-600 text-xl font-semibold mb-2">No se encontraron clientes</p>
                            <p className="text-gray-400">Intenta cambiar los filtros de búsqueda</p>
                            <button onClick={acciones.limpiarFiltros} className="btn btn-primary btn-sm mt-4">
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="table table-zebra w-full">
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
                        {todosLosRegistros.map((cliente) => (
                            <tr key={`${cliente.tipo_usuario}-${cliente.id}`} className="hover">
                                <td className="font-semibold">
                                    <div className="flex items-center gap-2">
                                        {cliente.tipo_usuario === 'usuario' && (
                                            <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        )}
                                        <span>{cliente.name}</span>
                                    </div>
                                </td>
                                <td className="font-mono text-sm">{cliente.email}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        {cliente.tipo_documento ? (
                                            <>
                                                <span className={`badge ${obtenerColorDocumento(cliente.tipo_documento)}`}>
                                                    {cliente.tipo_documento?.toUpperCase()}
                                                </span>
                                                <span className="font-mono text-sm">{cliente.numero_documento}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Sin documento</span>
                                        )}
                                    </div>
                                </td>
                                <td>{cliente.telefono || '-'}</td>
                                <td className="text-center">
                                    <span className="badge badge-outline badge-sm">{cliente.nacionalidad || '-'}</span>
                                </td>
                                <td className="max-w-xs">
                                    {cliente.direccion ? cliente.direccion : 'Sin dirección'}
                                </td>
                                <td className="text-sm text-gray-500">
                                    {new Date(cliente.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td>
                                    <div className="flex gap-1">
                                        <button className="btn btn-sm btn-ghost btn-outline">
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        <button className="btn btn-sm btn-primary" onClick={() => abrirEdicion(cliente)}>
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>


            <EditCliente cliente={clienteEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion} />
        </>
    );
}
