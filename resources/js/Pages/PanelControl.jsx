import CreateHabitacion from "@/Components/CreateHabitacion";
import Cuadricula from "@/Components/Cuadricula";
import PrimaryButton from "@/Components/PrimaryButton";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePanelControl } from "@/hooks/usePanelControl";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Legend, Bar } from 'recharts';
import { useState } from 'react';
import { CheckCircleIcon, LockClosedIcon, CogIcon, SparklesIcon, HomeIcon, UsersIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function PanelControl({ habitaciones = [] }) {
    const { filtros, datos, acciones } = usePanelControl(habitaciones);
    const [tabActiva, setTabActiva] = useState('habitaciones');

    const stats = [
        {
            title: 'Disponibles',
            value: datos.conteos.disponible,
            icon: <CheckCircleIcon className="w-8 h-8" />,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'Ocupadas',
            value: datos.conteos.ocupada,
            icon: <LockClosedIcon className="w-8 h-8" />,
            color: 'text-error',
            bgColor: 'bg-error/10',
        },
        {
            title: 'Mantenimiento',
            value: datos.conteos.mantenimiento,
            icon: <CogIcon className="w-8 h-8" />,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            title: 'Limpieza',
            value: datos.conteos.limpieza,
            icon: <SparklesIcon className="w-8 h-8" />,
            color: 'text-info',
            bgColor: 'bg-info/10',
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="w-full flex flex-col bg-base-200">
                <div className="bg-gris border-b border-base-300 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4 bg-gris">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-base-content">Panel de Control de Habitaciones</h1>
                                <p className="text-sm text-base-content/60 mt-1">Vista general y gestión del estado de habitaciones</p>
                            </div>
                            <CreateHabitacion/>
                        </div>
                    </div>
                </div>

                <div className="flex-grow bg-base-200">
                    <div className="max-w-7xl mx-auto px-6 py-6">


                        <div className="flex gap-1 mb-0">
                            <button
                                className={`relative flex items-center gap-3 px-8 py-4 rounded-t-2xl font-semibold transition-all duration-300 ${
                                    tabActiva === 'habitaciones'
                                        ? 'bg-white text-primary shadow-lg scale-105 -mb-px z-10'
                                        : 'bg-white/50 text-base-content/60 hover:bg-white/70 hover:scale-102'
                                }`}
                                onClick={() => setTabActiva('habitaciones')}>
                                <HomeIcon className="w-6 h-6" />
                                <span className="text-base">Habitaciones</span>
                                {tabActiva === 'habitaciones' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary rounded-t-lg"></div>
                                )}
                            </button>

                            <button
                                className={`relative flex items-center gap-3 px-8 py-4 rounded-t-2xl font-semibold transition-all duration-300 ${
                                    tabActiva === 'clientes'
                                        ? 'bg-white text-primary shadow-lg scale-105 -mb-px z-10'
                                        : 'bg-white/50 text-base-content/60 hover:bg-white/70 hover:scale-102'
                                }`}
                                onClick={() => setTabActiva('clientes')}>
                                <UsersIcon className="w-6 h-6" />
                                <span className="text-base">Clientes</span>
                                {tabActiva === 'clientes' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-info to-info/70 rounded-t-lg"></div>
                                )}
                            </button>

                            <button
                                className={`relative flex items-center gap-3 px-8 py-4 rounded-t-2xl font-semibold transition-all duration-300 ${
                                    tabActiva === 'empleados'
                                        ? 'bg-white text-primary shadow-lg scale-105 -mb-px z-10'
                                        : 'bg-white/50 text-base-content/60 hover:bg-white/70 hover:scale-102'
                                }`}
                                onClick={() => setTabActiva('empleados')}>
                                <BriefcaseIcon className="w-6 h-6" />
                                <span className="text-base">Empleados</span>
                                {tabActiva === 'empleados' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-warning/70 rounded-t-lg"></div>
                                )}
                            </button>
                        </div>


                        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-xl border-t-4 border-primary/20 overflow-hidden">
                            {tabActiva === 'habitaciones' && (
                                <div className="p-6">
                                    <div className="bg-base-100 p-6 rounded-lg mb-6 shadow-sm border border-base-300">
                                        <div style={{ width: '100%', height: 140 }}>
                                            <ResponsiveContainer width="100%" height={140}>
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

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        {stats.map((stat, index) => (
                                            <div key={index} className="stats shadow-md bg-white border border-base-300">
                                                <div className="stat py-3">
                                                    <div className="stat-figure text-primary">
                                                        <div className={`${stat.bgColor} ${stat.color} rounded-full p-2`}>
                                                            {stat.icon}
                                                        </div>
                                                    </div>
                                                    <div className="stat-title text-xs">{stat.title}</div>
                                                    <div className={`stat-value ${stat.color} text-3xl`}>{stat.value}</div>
                                                </div>
                                            </div>
                                        ))}
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

                                        <div className="mb-4">
                                            <h3 className="font-medium text-sm mb-3">Leyenda de Estados</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-success rounded-full ring-1 ring-white/10 shadow-sm"></div>
                                                    <span className="text-xs">Disponible</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-error rounded-full ring-1 ring-white/10 shadow-sm"></div>
                                                    <span className="text-xs">Ocupada</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-warning rounded-full ring-1 ring-white/10 shadow-sm"></div>
                                                    <span className="text-xs">Mantenimiento</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-info rounded-full ring-1 ring-white/10 shadow-sm"></div>
                                                    <span className="text-xs">Limpieza</span>
                                                </div>
                                            </div>
                                        </div>

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
                                <Cuadricula habitaciones={datos.habitacionesFiltradas} />
                            </div>
                        </div>
                    </div>
                )}

                {tabActiva === 'clientes' && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6 text-primary">Gestión de Clientes</h2>
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <UsersIcon className="w-24 h-24 text-gray-300" />
                            <div className="text-center">
                                <p className="text-gray-600 text-xl font-semibold mb-2">Sección en desarrollo</p>
                                <p className="text-gray-400">Aquí se mostrará la lista de clientes</p>
                            </div>
                        </div>
                    </div>
                )}

                {tabActiva === 'empleados' && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6 text-primary">Gestión de Empleados</h2>
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <BriefcaseIcon className="w-24 h-24 text-gray-300" />
                            <div className="text-center">
                                <p className="text-gray-600 text-xl font-semibold mb-2">Sección en desarrollo</p>
                                <p className="text-gray-400">Aquí se mostrará la lista de empleados</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
