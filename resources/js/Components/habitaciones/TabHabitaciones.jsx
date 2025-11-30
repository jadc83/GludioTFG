import IndexHabitacion from "./IndexHabitacion";
import PrimaryButton from "../PrimaryButton";
import LeyendaEstados from "../LeyendaEstados";
import { useHabitacionControl } from "@/hooks/useHabitacionControl";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar } from 'recharts';

export default function TabHabitaciones({ habitaciones = [] }) {

    const { filtros, datos, acciones } = useHabitacionControl(habitaciones);

    return (
        <div className="p-6">
            <div className="bg-base-100 p-6 rounded-lg mb-6 shadow-sm flex items-center justify-start pl-4">
                <LeyendaEstados />
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

            <div className="space-y-4 mb-6">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">Buscar</span>
                    </label>
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Estado</span>
                        </label>
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
                        <label className="label">
                            <span className="label-text font-medium">Capacidad</span>
                        </label>
                        <select className="select select-bordered w-full" value={filtros.capacidad} onChange={(e) => filtros.setCapacidad(e.target.value)}>
                            <option value="todos">Todas</option>
                            {datos.capacidadesDisponibles.map(cap => (<option key={cap} value={cap}>{cap} persona{cap > 1 ? 's' : ''}
                            </option>))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Precio</span>
                        </label>
                        <div className="flex gap-2">
                            <input type="number" placeholder="Mín" className="input input-bordered input-sm w-full" value={filtros.precioMin || ''}
                                onChange={(e) => filtros.setPrecioMin(e.target.value)} />
                            <input type="number" placeholder="Máx" className="input input-bordered input-sm w-full" value={filtros.precioMax || ''}
                                onChange={(e) => filtros.setPrecioMax(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                <div className="text-sm text-gray-500">
                    Mostrando <span className="font-bold">{datos.habitacionesFiltradas.length}</span> de {habitaciones.length} habitaciones
                </div>
                <div className="flex gap-2">
                    <PrimaryButton onClick={acciones.limpiarFiltros}>
                        Limpiar filtros
                    </PrimaryButton>
                </div>
            </div>

            <IndexHabitacion habitaciones={datos.habitacionesFiltradas} />
        </div>
    );
}
