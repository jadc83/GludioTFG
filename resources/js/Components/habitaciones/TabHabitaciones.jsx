import IndexHabitacion from "./IndexHabitacion";
import PrimaryButton from "../PrimaryButton";
import LeyendaEstados from "../LeyendaEstados";
import { useHabitacionControl } from "@/hooks/useHabitacionControl";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Legend, Bar } from 'recharts';

export default function TabHabitaciones({ habitaciones = [] }) {
    const { filtros, datos, acciones } = useHabitacionControl(habitaciones);

    return (
        <div className="p-6">
            <div className="bg-base-100 p-6 rounded-lg mb-6 shadow-sm flex items-center justify-start pl-4">
                <div style={{ width: '100%', height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datos.dataChart} layout="vertical" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradDisponible" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradOcupada" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#f87171" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradMantenimiento" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradLimpieza" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                            <Legend verticalAlign="top" align="center" iconType="circle" />
                            <XAxis type="number" domain={[0, datos.conteos.total]} axisLine={false} tick={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" axisLine={false} tick={false} tickLine={false} />
                            <Bar dataKey="disponible" stackId="a" fill="url(#gradDisponible)" />
                            <Bar dataKey="ocupada" stackId="a" fill="url(#gradOcupada)" />
                            <Bar dataKey="mantenimiento" stackId="a" fill="url(#gradMantenimiento)" />
                            <Bar dataKey="limpieza" stackId="a" fill="url(#gradLimpieza)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex gap-6">
                <div className="w-80 flex-shrink-0">
                    <div className="card bg-white shadow-lg sticky top-20">
                        <div className="card-body p-6">
                            <h2 className="card-title text-lg mb-4">Filtros</h2>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Estado</span>
                                </label>
                                <select
                                    className="select select-sm select-bordered w-full h-10 min-h-10"
                                    value={filtros.estado}
                                    onChange={(e) => filtros.setEstado(e.target.value)}>
                                    <option value="todos">Todos</option>
                                    <option value="disponible">Disponibles</option>
                                    <option value="ocupada">Ocupadas</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                    <option value="limpieza">Limpieza</option>
                                </select>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Tipo</span>
                                </label>
                                <select
                                    className="select select-sm select-bordered w-full h-10 min-h-10"
                                    value={filtros.tipo}
                                    onChange={(e) => filtros.setTipo(e.target.value)}>
                                    <option value="todos">Todos</option>
                                    <option value="doble">Doble</option>
                                    <option value="suite">Suite</option>
                                    <option value="familiar">Familiar</option>
                                </select>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Capacidad</span>
                                </label>
                                <select
                                    className="select select-sm select-bordered w-full h-10 min-h-10"
                                    value={filtros.capacidad}
                                    onChange={(e) => filtros.setCapacidad(e.target.value)}>
                                    <option value="todos">Todas</option>
                                    {datos.capacidadesDisponibles.map(cap => (
                                        <option key={cap} value={cap}>{cap} persona{cap > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Rango de Precio</span>
                                </label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Mínimo" className="input input-sm input-bordered w-full h-10"
                                        value={filtros.precioMin} onChange={(e) => filtros.setPrecioMin(e.target.value)} />
                                    <input type="number" placeholder="Máximo" className="input input-sm input-bordered w-full h-10"
                                        value={filtros.precioMax} onChange={(e) => filtros.setPrecioMax(e.target.value)} />
                                </div>
                            </div>

                            <div className="divider my-2"></div>
                            <LeyendaEstados />
                            <div className="divider my-2"></div>

                            <div className="text-center text-sm text-base-content/60 mb-3">
                                Mostrando <span className="font-bold text-base-content">{datos.habitacionesFiltradas.length}</span> de {habitaciones.length}
                            </div>

                            <PrimaryButton onClick={acciones.limpiarFiltros} className="w-full">
                                Limpiar filtros
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <IndexHabitacion habitaciones={datos.habitacionesFiltradas} />
                </div>
            </div>
        </div>
    );
}
