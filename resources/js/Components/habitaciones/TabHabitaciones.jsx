import IndexHabitacion from "./IndexHabitacion";
import { useHabitacionControl } from "@/hooks/useHabitacionControl";
import { FunnelIcon } from '@heroicons/react/24/outline';

export default function TabHabitaciones({ habitaciones = [] }) {

    const { filtros, datos, acciones } = useHabitacionControl(habitaciones);

    return (
        <div className="p-6">
            <div className="space-y-4 mb-6">
                <div className="form-control">
                    <label className="label">Buscar</label>
                    <div className="flex items-center gap-3 p-3 bg-white max-w-md mx-auto mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <input type="text" placeholder="Número, tipo o descripción..." className="flex-1 input input-bordered bg-base-100 border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                            value={filtros.busqueda || ''} onChange={(e) => filtros.setBusqueda(e.target.value)} />
                        <div className="w-10 h-10 bg-gradient-to-r from-success/20 to-emerald/20 border border-success/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="form-control">
                        <label className="label">Estado</label>
                        <select className="select select-bordered w-full" value={filtros.estado} onChange={(e) => filtros.setEstado(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="disponible">Disponibles</option>
                            <option value="ocupada">Ocupadas</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="limpieza">Limpieza</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Tipo</span>
                        </label>
                        <select className="select select-bordered w-full" value={filtros.tipo} onChange={(e) => filtros.setTipo(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="doble">Doble</option>
                            <option value="suite">Suite</option>
                            <option value="familiar">Familiar</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">Capacidad</label>
                        <select className="select select-bordered w-full" value={filtros.capacidad} onChange={(e) => filtros.setCapacidad(e.target.value)}>
                            <option value="todos">Todas</option>
                            {datos.capacidadesDisponibles.map(cap => (<option key={cap} value={cap}>{cap} persona{cap > 1 ? 's' : ''}
                            </option>))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">Precio</label>
                        <div className="flex gap-2">
                            <input type="number" placeholder="Mín" className="input input-bordered w-full" value={filtros.precioMin || ''}
                                onChange={(e) => filtros.setPrecioMin(e.target.value)} />
                            <input type="number" placeholder="Máx" className="input input-bordered w-full" value={filtros.precioMax || ''}
                                onChange={(e) => filtros.setPrecioMax(e.target.value)} />
                        </div>
                    </div>

                    <div className="self-end">
                        <button type="button" onClick={acciones.limpiarFiltros} className="btn btn-outline btn-info w-full hover:btn-info">
                            <FunnelIcon className="w-4 h-4 mr-2" /> Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {acciones.hayFiltrosActivos && (
                <div className="flex justify-end mb-4">
                        {datos.habitacionesFiltradas.length} resultados encontrados
                </div>
            )}

            <IndexHabitacion habitaciones={datos.habitacionesFiltradas} />
        </div>
    );
}
