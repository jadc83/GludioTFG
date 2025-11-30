import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, InboxIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import EditCliente from '@/Components/clientes/EditCliente';
import CreateCliente from '@/Components/clientes/CreateCliente';

export default function IndexCliente({ clientes = [] }) {
    const [clienteEditar, setClienteEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [filtroDocumento, setFiltroDocumento] = useState('todos');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

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

    const conteos = useMemo(() => ({
        dni: clientes.filter(c => c.tipo_documento === 'dni').length,
        pasaporte: clientes.filter(c => c.tipo_documento === 'pasaporte').length,
        tie: clientes.filter(c => c.tipo_documento === 'tie').length,
        total: clientes.length
    }), [clientes]);

    const clientesFiltrados = useMemo(() => {
        const busquedaLower = filtroBusqueda.toLowerCase().trim();

        return clientes.filter(cliente => {
            const cumpleDocumento = filtroDocumento === 'todos' || cliente.tipo_documento === filtroDocumento;

            const cumpleBusqueda = busquedaLower === '' || [
                cliente.name,
                cliente.email,
                cliente.numero_documento,
                cliente.telefono
            ].some(campo =>
                campo &&
                campo.toString().toLowerCase().includes(busquedaLower)
            );

            return cumpleDocumento && cumpleBusqueda;
        });
    }, [clientes, filtroDocumento, filtroBusqueda]);

    const limpiarFiltros = () => {
        setFiltroDocumento('todos');
        setFiltroBusqueda('');
    };

    if (clientes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <InboxIcon className="w-24 h-24 text-gray-300" />
                <div className="text-center">
                    <p className="text-gray-600 text-xl font-semibold mb-2">No hay clientes registrados</p>
                    <p className="text-gray-400">Crea un nuevo cliente para comenzar</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <div className="stats shadow bg-base-100">
                        <div className="stat">
                            <div className="stat-title">Total</div>
                            <div className="stat-value">{conteos.total}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">DNI</div>
                            <div className="stat-value">{conteos.dni}</div>
                        </div>
                    </div>
                </div>
                <CreateCliente />
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
                <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Nombre, email, documento o teléfono..." className="input input-bordered w-full pl-11"
                        value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)}/>
                </div>
                <select className="select select-bordered w-full lg:w-auto max-w-xs" value={filtroDocumento}
                    onChange={(e) => setFiltroDocumento(e.target.value)}>
                    <option value="todos">Todos los documentos</option>
                    <option value="dni">DNI</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="tie">TIE</option>
                </select>
                <button onClick={limpiarFiltros} className="btn btn-outline btn-sm">
                    <FunnelIcon className="w-4 h-4" />
                    Limpiar
                </button>
            </div>

            <div className="overflow-x-auto">
                <div className="text-sm text-gray-500 mb-4">
                    Mostrando {clientesFiltrados.length} de {clientes.length} clientes
                </div>
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
                        {clientesFiltrados.map((cliente) => (
                            <tr key={cliente.id} className="hover">
                                <td className="font-semibold">{cliente.name}</td>
                                <td className="font-mono text-sm">{cliente.email}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${obtenerColorDocumento(cliente.tipo_documento)}`}>
                                            {cliente.tipo_documento?.toUpperCase()}
                                        </span>
                                        <span className="font-mono text-sm">{cliente.numero_documento}</span>
                                    </div>
                                </td>
                                <td>{cliente.telefono}</td>
                                <td className="badge badge-outline badge-sm">{cliente.nacionalidad}</td>
                                <td className="max-w-xs">
                                    {cliente.direccion ? (
                                        <span className="line-clamp-2">{cliente.direccion}</span>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">Sin dirección</span>
                                    )}
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
            </div>

            <EditCliente cliente={clienteEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion} />
        </>
    );
}
