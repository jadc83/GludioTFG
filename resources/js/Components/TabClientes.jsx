import { useClientesControl } from "@/hooks/useClientesControl";
import PrimaryButton from "@/Components/PrimaryButton";

export default function TabClientes({ clientes = [] }) {
    const { filtros, datos, acciones } = useClientesControl(clientes);

    return (
        <div className="p-6">
            <div className="flex gap-6">
                <div className="w-80 flex-shrink-0">
                    <div className="card bg-base-100 shadow-lg sticky top-20 p-6">
                        <h2 className="card-title text-lg mb-4">Filtros</h2>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text font-medium">Estado</span>
                            </label>
                            <select className="select select-sm select-bordered w-full" value={filtros.estado} onChange={(e) => filtros.setEstado(e.target.value)}>
                                <option value="todos">Todos</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text font-medium">Buscar</span>
                            </label>
                            <input type="text" placeholder="Nombre o email..." className="input input-sm input-bordered w-full" value={filtros.busqueda}
                                onChange={(e) => filtros.setBusqueda(e.target.value)}/>
                        </div>

                        <div className="divider my-2"></div>

                        <div className="text-center text-sm text-base-content/60 mb-3">
                            Mostrando <span className="font-bold">{datos.clientesFiltrados.length}</span> de {clientes.length}
                        </div>

                        <div className="mb-3">
                            <p className="text-xs font-medium mb-2">Estados:</p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-success rounded-full"></div>
                                    <span className="text-xs">Activos: {datos.conteos.activo}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-error rounded-full"></div>
                                    <span className="text-xs">Inactivos: {datos.conteos.inactivo}</span>
                                </div>
                            </div>
                        </div>

                        <div className="divider my-2"></div>

                        <PrimaryButton onClick={acciones.limpiarFiltros} className="w-full mb-2">
                            Limpiar filtros
                        </PrimaryButton>
                        <PrimaryButton className="w-full">Nuevo Cliente</PrimaryButton>
                    </div>
                </div>

                {/* Tabla */}
                <div className="flex-1">
                    <div className="bg-base-100 rounded-lg shadow border overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">Lista de Clientes</h3>
                            <p className="text-sm text-base-content/60 mt-1">Gestión de clientes registrados</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Teléfono</th>
                                        <th>Reservas</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.clientesFiltrados.map(cliente => (
                                        <tr key={cliente.id}>
                                            <td className="font-medium">{cliente.nombre}</td>
                                            <td>{cliente.email}</td>
                                            <td>{cliente.telefono || 'N/A'}</td>
                                            <td>{cliente.reservas_count || 0}</td>
                                            <td>
                                                <span className={`badge ${
                                                    cliente.estado === 'activo'
                                                        ? 'badge-success'
                                                        : 'badge-error'
                                                }`}>
                                                    {cliente.estado}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline">Ver</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
