import EditHabitacion from '@/Components/habitaciones/formulario/EditHabitacion';
import { EyeIcon, InboxIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
                        <div className="overflow-x-auto p-4">
                            <table className="table-compact table-pro table w-full">
                                <thead>
                                    <tr>
                                        <th>Número</th>
                                        <th>Tipo</th>
                                        <th>Capacidad</th>
                                        <th>Precio/Noche</th>
                                        <th>Estado</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habitacionesPaginadas.map((habitacion) => (
                                        <tr
                                            key={habitacion.id}
                                            className="hover"
                                        >
                                            <td className="font-mono font-semibold">
                                                {habitacion.numero}
                                            </td>
                                            <td className="capitalize">
                                                {habitacion.tipo}
                                            </td>
                                            <td>
                                                <span className="badge badge-outline badge-sm">
                                                    {habitacion.capacidad}{' '}
                                                    persona
                                                    {habitacion.capacidad > 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            </td>
                                            <td className="font-mono text-sm">
                                                €
                                                {parseFloat(
                                                    habitacion.precio_noche ||
                                                        0,
                                                ).toFixed(2)}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${obtenerColorEstado(habitacion.estado)} gap-2 capitalize`}
                                                >
                                                    {habitacion.estado}
                                                </span>
                                            </td>
                                            <td className="max-w-xs">
                                                {habitacion.descripcion || (
                                                    <span className="text-xs italic text-gray-400">
                                                        Sin descripción
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="btn btn-ghost btn-outline btn-sm"
                                                        title="Ver habitación"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        title="Editar habitación"
                                                        onClick={() =>
                                                            abrirEdicion(
                                                                habitacion,
                                                            )
                                                        }
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
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
                    <div className="flex flex-col items-center justify-between gap-6 border-t border-gray-200 bg-gris px-6 py-6 sm:flex-row">
                        <div className="text-sm font-medium text-gray-700">
                            <span className="font-semibold text-primary">{inicio + 1}</span>
                            <span className="mx-1 text-gray-500">a</span>
                            <span className="font-semibold text-primary">{Math.min(fin, habitaciones.length)}</span>
                            <span className="mx-1 text-gray-500">de</span>
                            <span className="font-semibold text-primary">{habitaciones.length}</span>
                            <span className="ml-1 text-gray-600">habitacion{habitaciones.length !== 1 ? 'es' : ''}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={irAPaginaAnterior}
                                disabled={paginaActual === 1}
                                className="btn btn-sm gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400"
                                title="Página anterior"
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Anterior</span>
                            </button>

                            <div className="flex items-center gap-1 rounded-lg bg-white p-2 shadow-sm">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                                    <button
                                        key={pagina}
                                        onClick={() => setPaginaActual(pagina)}
                                        className={`btn btn-xs px-3 transition-all ${
                                            paginaActual === pagina
                                                ? 'border-0 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                                                : 'border-0 bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {pagina}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={irAProximaPagina}
                                disabled={paginaActual === totalPaginas}
                                className="btn btn-sm gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400"
                                title="Próxima página"
                            >
                                <span className="hidden sm:inline">Siguiente</span>
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <EditHabitacion
                habitacion={habitacionEditar}
                abierto={drawerAbierto}
                onCerrar={cerrarEdicion}
            />
        </>
    );
}
