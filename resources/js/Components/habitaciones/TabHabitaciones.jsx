import { useState, useEffect } from 'react';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { FunnelIcon } from '@heroicons/react/24/outline';
import IndexHabitacion from './IndexHabitacion';
import Campo from '@/Components/formulario/Campo';

export default function TabHabitaciones({ habitaciones = [] }) {
    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { estado: 'todos', tipo: 'todos', capacidad: 'todos', precio_min: '', precio_max: '', busqueda: '' }, 'panel', ['habitaciones']);

    const [hayFiltrosActivos, setHayFiltrosActivos] = useState(false);

    /**
     * Verifica si hay filtros activos (distintos del valor inicial)
     */
    useEffect(() => {
        const activos =
            filtros.estado !== 'todos' ||
            filtros.tipo !== 'todos' ||
            filtros.capacidad !== 'todos' ||
            filtros.precio_min !== '' ||
            filtros.precio_max !== '' ||
            filtros.busqueda !== '';
        setHayFiltrosActivos(activos);
    }, [filtros]);

    return (
        <div className="p-3 md:p-6">
            <div className="mb-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:gap-3 lg:grid-cols-5">
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-xs md:text-sm font-medium">
                                Búsqueda
                            </span>
                        </label>
                        <Campo
                            id="habitacion_busqueda"
                            name="busqueda"
                            placeholder="busca algun dato"
                            clase="input input-bordered w-full"
                            value={filtros.busqueda || ''}
                            onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs md:text-sm">Estado</span></label>
                        <select className="select select-bordered w-full" value={filtros.estado} onChange={(e) =>
                                actualizarFiltro('estado', e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="disponible">Disponibles</option>
                            <option value="ocupada">Ocupadas</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="limpieza">Limpieza</option>
                        </select>
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-xs md:text-sm font-medium">Tipo</span>
                        </label>
                        <select className="select select-bordered w-full" value={filtros.tipo} onChange={(e) => actualizarFiltro('tipo', e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="doble">Doble</option>
                            <option value="suite">Suite</option>
                            <option value="familiar">Familiar</option>
                        </select>
                    </div>

                    <div className="form-control w-full">
                        <label className="label py-1"><span className="label-text text-xs md:text-sm">Precio</span></label>
                        <div className="flex gap-2">
                            <Campo
                                id="precio_min"
                                name="precio_min"
                                type="number"
                                placeholder="Mín"
                                clase="input input-bordered w-full"
                                value={filtros.precio_min || ''}
                                onChange={(e) => actualizarFiltro('precio_min', e.target.value)}
                            />
                            <Campo
                                id="precio_max"
                                name="precio_max"
                                type="number"
                                placeholder="Máx"
                                clase="input input-bordered w-full"
                                value={filtros.precio_max || ''}
                                onChange={(e) => actualizarFiltro('precio_max', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="self-end">
                        <button type="button" onClick={limpiarFiltros} className="btn btn-info btn-outline w-full hover:btn-info">
                            <FunnelIcon className="mr-2 h-4 w-4" />
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {hayFiltrosActivos && (
                <div className="mb-4 flex justify-end">
                    {habitaciones.length} resultados encontrados
                </div>
            )}

            {habitaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-gray-50 py-12">
                    <p className="text-gray-600">No hay habitaciones que coincidan con los filtros aplicados</p>
                    <button onClick={limpiarFiltros} className="btn btn-primary btn-sm">
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <>
                    <IndexHabitacion key={`${filtros.estado}-${filtros.tipo}-${filtros.capacidad}-${filtros.precio_min}-${filtros.precio_max}-${filtros.busqueda}`}
                        habitaciones={habitaciones}/>
                </>
            )}
        </div>
    );
}
