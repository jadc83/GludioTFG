import IndexHabitacion from "./IndexHabitacion";
import { useHabitacionControl } from "@/hooks/useHabitacionControl";
import { FunnelIcon } from '@heroicons/react/24/outline';

export default function TabHabitaciones({ habitaciones = [] }) {

    const { filtros, datos, acciones } = useHabitacionControl(habitaciones);

    return (
        <div className="p-6">
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text font-medium">Búsqueda</span></label>
                        <input type="text" placeholder="busca algun dato" className="input input-bordered w-full"
                            value={filtros.busqueda || ''} onChange={(e) => filtros.setBusqueda(e.target.value)} />
                    </div>
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
