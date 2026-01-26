import EditHabitacion from '@/Components/habitaciones/formulario/EditHabitacion';
import { InboxIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState, useMemo, useEffect } from 'react';

export default function IndexHabitacion({ habitaciones = [] }) {
    const [habitacionEditar, setHabitacionEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    /**
     * Resetea la paginación cuando cambian las habitaciones
     * (por ejemplo, cuando se filtran)
     */
    useEffect(() => {
        setPaginaActual(1);
    }, [habitaciones.length]);

    const abrirEdicion = (habitacion) => {
        setHabitacionEditar(habitacion);
        setDrawerAbierto(true);
    };

    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setHabitacionEditar(null), 300);
    };

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'disponible':
                return 'badge-success';
            case 'ocupada':
                return 'badge-error';
            case 'mantenimiento':
                return 'badge-warning';
            case 'limpieza':
                return 'badge-info';
            default:
                return 'badge-neutral';
        }
    };

    // Calcular datos paginados
    const { habitacionesPaginadas, totalPaginas, inicio, fin } = useMemo(() => {
        const totalPaginas = Math.ceil(habitaciones.length / itemsPorPagina);
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const habitacionesPaginadas = habitaciones.slice(inicio, fin);
        return { habitacionesPaginadas, totalPaginas, inicio, fin };
    }, [habitaciones, paginaActual]);

    const irAProximaPagina = () => {
        if (paginaActual < totalPaginas) {
            setPaginaActual(paginaActual + 1);
        }
    };

    const irAPaginaAnterior = () => {
        if (paginaActual > 1) {
            setPaginaActual(paginaActual - 1);
        }
    };

    return (
        <>
            <div className="table-pro-wrapper">
                {habitaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <InboxIcon className="h-24 w-24 text-gray-300" />
                        <div className="text-center">
                            <p className="mb-2 text-xl font-semibold text-gray-600">
                                No hay habitaciones registradas
                            </p>
                            <p className="text-gray-400">
                                Crea una nueva habitación para comenzar
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
                        <div className="overflow-x-auto p-2 md:p-4">
                            <table className="table table-zebra table-compact w-full text-xs md:text-sm panel-table">
                                <thead>
                                    <tr>
                                        <th>Número</th>
                                        <th>Tipo</th>
                                        <th>Capacidad</th>
                                        <th>Estado</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habitacionesPaginadas.map((habitacion) => (
                                        <tr key={habitacion.id} className="hover">
                                            <td className="font-mono font-semibold">{habitacion.numero}</td>
                                            <td className="capitalize">{habitacion.tipo}</td>
                                            <td>
                                                <span className="badge badge-outline badge-sm">
                                                    {habitacion.capacidad}{' '}personas
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${obtenerColorEstado(habitacion.estado)} gap-2 capitalize`}>{habitacion.estado}</span>
                                            </td>
                                            <td className="max-w-xs">
                                                {habitacion.descripcion || (
                                                    <span className="text-xs italic text-gray-400">Sin descripción</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button className="btn btn-sm btn-index btn-primary-burgundy" title="Editar habitación" onClick={() => abrirEdicion( habitacion)}>
                                                        <PencilIcon className="h-6 w-6" />
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

                {habitaciones.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gris footer-panel px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 sm:flex-row">
                        <div className="text-xs font-medium text-gray-700 md:text-sm">
                            <span className="font-semibold text-primary">{inicio + 1}</span>
                            <span className="mx-1 text-gray-500">a</span>
                            <span className="font-semibold text-primary">{Math.min(fin, habitaciones.length)}</span>
                            <span className="mx-1 text-gray-500">de</span>
                            <span className="font-semibold text-primary">{habitaciones.length}</span>
                            <span className="ml-1 text-gray-600">habitacion{habitaciones.length !== 1 ? 'es' : ''}</span>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                            <button onClick={irAPaginaAnterior} disabled={paginaActual === 1} className="btn btn-xs md:btn-sm gap-1 md:gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400" title="Página anterior">
                                <ChevronLeftIcon className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="hidden sm:inline text-xs md:text-base">Anterior</span>
                            </button>

                            <div className="flex items-center gap-1 rounded-lg bg-white p-1 md:p-2 shadow-sm">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                                    <button key={pagina} onClick={() => setPaginaActual(pagina)} className={`btn btn-xs px-2 md:px-3 transition-all ${
                                            paginaActual === pagina ? 'border-0 bg-gradient-to-r from-red-500 to-red-600 text-xs md:text-base'
                                                : 'border-0 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs md:text-base'
                                        }`}>
                                        {pagina}
                                    </button>
                                ))}
                            </div>

                            <button onClick={irAProximaPagina} disabled={paginaActual === totalPaginas} className="btn btn-xs md:btn-sm gap-1 md:gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400" title="Próxima página">
                                <span className="hidden sm:inline text-xs md:text-base">Siguiente</span>
                                <ChevronRightIcon className="h-3 w-3 md:h-4 md:w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <EditHabitacion habitacion={habitacionEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion}/>
        </>
    );
}
