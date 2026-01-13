import '@/../css/createReserva.css';
import {
    FunnelIcon,
    InboxIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function IndexReserva({ reservas = [] }) {
    const [filtros, setFiltros] = useState({
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
    });
    const actualizarFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };
    const hayFiltrosActivos =
        filtros.status !== 'todos' ||
        filtros.localizador !== '' ||
        filtros.cliente !== '' ||
        filtros.habitacion !== '';
    const limpiarFiltros = () => {
        setFiltros({
            status: 'todos',
            localizador: '',
            cliente: '',
            habitacion: '',
        });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: filtros.localizador || undefined,
                cliente: filtros.cliente || undefined,
                habitacion: filtros.habitacion || undefined,
            };

            Object.keys(params).forEach(
                (key) => params[key] === undefined && delete params[key],
            );

            router.get(route('panel'), params, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [filtros]);

    const obtenerColorStatus = (status) => {
        const colores = {
            confirmado: 'badge-success',
            checked_in: 'badge-warning',
            checked_out: 'badge-info',
            cancelado: 'badge-error',
            no_presentado: 'badge-ghost',
            pendiente: 'badge-neutral',
        };

        return colores[status] || 'badge-neutral';
    };

    const obtenerColorPago = (pago) => {
        const colores = {
            pagado: 'badge-success',
            parcial: 'badge-warning',
            devuelto: 'badge-info',
            pendiente: 'badge-error',
        };
        return colores[pago] || 'badge-error';
    };

    const eliminarReserva = (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            router.delete(`/reservas/${id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                    <label className="label">Localizador</label>
                    <input
                        type="text"
                        placeholder="CLI58C95..."
                        value={filtros.localizador}
                        onChange={(e) =>
                            actualizarFiltro('localizador', e.target.value)
                        }
                        className="input-bordered input w-full font-mono"
                    />
                </div>

                <div>
                    <label className="label">Cliente</label>
                    <input
                        type="text"
                        placeholder="Juan Pérez..."
                        value={filtros.cliente}
                        onChange={(e) =>
                            actualizarFiltro('cliente', e.target.value)
                        }
                        className="input-bordered input w-full"
                    />
                </div>

                <div>
                    <label className="label">Habitación</label>
                    <input
                        type="text"
                        placeholder="101, 102..."
                        value={filtros.habitacion}
                        onChange={(e) =>
                            actualizarFiltro('habitacion', e.target.value)
                        }
                        className="input-bordered input w-full"
                    />
                </div>

                <div>
                    <label className="label">Estado</label>
                    <select
                        value={filtros.status}
                        onChange={(e) =>
                            actualizarFiltro('status', e.target.value)
                        }
                        className="select-bordered select w-full"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="checked_in">Check-in</option>
                        <option value="checked_out">Check-out</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                <div className="self-end">
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="btn btn-info btn-outline w-full hover:btn-info"
                    >
                        <FunnelIcon className="mr-2 h-4 w-4" /> Limpiar filtros
                    </button>
                </div>
            </div>

            <div className="table-pro-wrapper">
                {reservas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20">
                        <InboxIcon className="h-24 w-24 text-gray-300" />
                        <div className="text-center">
                            <p className="mb-2 text-xl font-semibold text-gray-600">
                                No se encontraron reservas
                            </p>
                            <p className="text-gray-400">
                                Seleccione otros criterios de búsqueda
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
                        <div className="overflow-x-auto p-4">
                            <table className="table-compact table-pro table w-full">
                                <thead>
                                    <tr>
                                        <th>Localizador</th>
                                        <th>Cliente / Habitación</th>
                                        <th>Estadía</th>
                                        <th>Precio</th>
                                        <th>Estado</th>
                                        <th>Pago</th>
                                        <th>Creado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservas.map((reserva) => (
                                        <tr key={reserva.id} className="hover">
                                            <td className="font-mono font-semibold tracking-wider">
                                                {reserva.localizador}
                                            </td>

                                            <td className="celda-info-cliente">
                                                <div className="cliente-info-stack">
                                                    <div className="cliente-nombre">
                                                        {reserva.cliente_name ||
                                                            'Sin cliente'}
                                                    </div>

                                                    <div className="cliente-habitacion">
                                                        {reserva.habitacion_numero ||
                                                            'Sin habitación'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="celda-fechas font-mono">
                                                <div>
                                                    {new Date(
                                                        reserva.check_in,
                                                    ).toLocaleDateString(
                                                        'es-ES',
                                                    )}
                                                </div>
                                                <div className="fecha-checkout">
                                                    {' '}
                                                    →{' '}
                                                    {new Date(
                                                        reserva.check_out,
                                                    ).toLocaleDateString(
                                                        'es-ES',
                                                    )}{' '}
                                                </div>
                                            </td>

                                            <td className="celda-precio font-mono text-success">
                                                {parseFloat(
                                                    reserva.precio_total || 0,
                                                ).toFixed(2)}
                                                €
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${obtenerColorStatus(reserva.status)} gap-2`}
                                                >
                                                    {reserva.status
                                                        ?.replace('_', ' ')
                                                        .toUpperCase()}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${obtenerColorPago(reserva.pago)}`}
                                                >
                                                    {reserva.pago}
                                                </span>
                                            </td>

                                            <td className="celda-creado font-mono">
                                                {reserva.created_at ? (
                                                    <div>
                                                        {new Date(
                                                            reserva.created_at,
                                                        ).toLocaleString(
                                                            'es-ES',
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        title="Editar reserva"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/reservas/${reserva.id}/edit`,
                                                            )
                                                        }
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="btn btn-error btn-ghost btn-sm hover:btn-error hover:text-white"
                                                        title="Eliminar reserva"
                                                        onClick={() =>
                                                            eliminarReserva(
                                                                reserva.id,
                                                            )
                                                        }
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
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

                {hayFiltrosActivos && reservas.length > 0 && (
                    <div className="mt-4 flex justify-center text-sm text-gray-600">
                        Mostrando {reservas.length} reserva{' '}
                        {reservas.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </>
    );
}
