import '@/../css/createReserva.css';
import Campo from '@/Components/formulario/Campo';
import { FunnelIcon, InboxIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function IndexReserva({ reservas = [] }) {
    const [filtros, setFiltros] = useState({ status: 'todos', localizador: '', cliente: '',  habitacion: '' });
    const [refrescarTabla, setRefrescarTabla] = useState(0);
    const actualizarFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };
    const hayFiltrosActivos = filtros.status !== 'todos' || filtros.localizador !== '' || filtros.cliente !== '' || filtros.habitacion !== '';
    const limpiarFiltros = () => {
        setFiltros({ status: 'todos', localizador: '', cliente: '', habitacion: '' });
    };

    useEffect(() => {
        const contador = setTimeout(() => {
            const criterios = {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: filtros.localizador || undefined,
                cliente: filtros.cliente || undefined,
                habitacion: filtros.habitacion || undefined,
            };

            Object.keys(criterios).forEach(
                (key) => criterios[key] === undefined && delete criterios[key],
            );

            router.get(route('panel'), criterios, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => clearTimeout(contador);
    }, [filtros, refrescarTabla]);

    // Escuchar eventos de Reverb
    useEffect(() => {

        if (typeof window === 'undefined' || !window.Echo) return;

        const handler = (e) => {
            setRefrescarTabla((prev) => prev + 1);
        };

        const channel = window.Echo.private('reservas');
        channel.listen('ReservaCreada', handler);
        channel.listen('ReservaActualizada', handler);
        channel.listen('ReservaBorrada', handler);

        return () => {
            try {
                channel.stopListening('ReservaCreada');
                channel.stopListening('ReservaActualizada');
                channel.stopListening('ReservaBorrada');
            } catch (err) {

            }
        };
    }, []);

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

    const obtenerColorPago = (reserva) => {
        // Mostrar 'parcial' si hay reembolsos parciales realizados (0 < reembolsos_total < precio_total)
        const reembolsos = reserva.reembolsos_total || 0;
        if (reembolsos > 0 && reserva.precio_total && reembolsos < reserva.precio_total) return 'badge-warning';
        const colores = {
            pagado: 'badge-success',
            devuelto: 'badge-info',
            pendiente: 'badge-error',
        };
        return colores[reserva.pago] || 'badge-error';
    };

    const eliminarReserva = (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            router.delete(`/reservas/${id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:gap-3 lg:grid-cols-5">
                <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-xs md:text-sm">Localizador</span></label>
                    <Campo
                        id="filtro_localizador"
                        name="localizador"
                        placeholder="Introduce localizador de reserva."
                        value={filtros.localizador}
                        onChange={(e) => actualizarFiltro('localizador', e.target.value)}
                        className="input input-bordered w-full text-sm md:text-base"
                    />
                </div>

                <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-xs md:text-sm">Cliente</span></label>
                    <Campo
                        id="filtro_cliente"
                        name="cliente"
                        placeholder="Juan Pérez..."
                        value={filtros.cliente}
                        onChange={(e) => actualizarFiltro('cliente', e.target.value)}
                        className="input input-bordered w-full text-sm md:text-base"
                    />
                </div>

                <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-xs md:text-sm">Habitación</span></label>
                    <Campo
                        id="filtro_habitacion"
                        name="habitacion"
                        placeholder="101, 102..."
                        value={filtros.habitacion}
                        onChange={(e) => actualizarFiltro('habitacion', e.target.value)}
                        className="input input-bordered w-full text-sm md:text-base"
                    />
                </div>

                <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-xs md:text-sm">Estado</span></label>
                    <select value={filtros.status} onChange={(e) => actualizarFiltro('status', e.target.value)} className="select select-bordered w-full text-sm md:text-base">
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="checked_in">Check-in</option>
                        <option value="checked_out">Check-out</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                <div className="form-control w-full">
                    <button type="button" onClick={limpiarFiltros} className="btn btn-info btn-outline btn-sm md:btn-md w-full hover:btn-info mt-6" >
                        <FunnelIcon className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Limpiar</span>
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
                        <div className="overflow-x-auto p-2 md:p-4">
                            <table className="table table-zebra table-compact w-full text-xs md:text-sm">
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
                                                    {new Date( reserva.check_in).toLocaleDateString('es-ES')}
                                                </div>
                                                <div className="fecha-checkout">
                                                    {' '}→{' '}
                                                    {new Date( reserva.check_out).toLocaleDateString('es-ES')}
                                                    {' '}
                                                </div>
                                            </td>

                                            <td className="celda-precio font-mono text-success">
                                                {parseFloat( reserva.precio_total || 0 ).toFixed(2)} €
                                            </td>

                                            <td>
                                                <span className={`badge ${obtenerColorStatus(reserva.status)} gap-2`}>
                                                    {reserva.status ?.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`badge ${obtenerColorPago(reserva)}`}>{(reserva.reembolsos_total > 0 && reserva.reembolsos_total < reserva.precio_total) ? 'Parcialmente reembolsado' : (reserva.pago ? reserva.pago : '')}</span>
                                            </td>

                                            <td className="celda-creado font-mono">
                                                {reserva.created_at ? (
                                                    <div>
                                                        {new Date( reserva.created_at).toLocaleString('es-ES')}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="flex gap-1">
                                                    <button className="btn btn-primary btn-sm" title="Editar reserva"
                                                        onClick={() => router.visit( `/reservas/${reserva.id}/edit`)}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button className="btn btn-error btn-ghost btn-sm hover:btn-error hover:text-white" title="Eliminar reserva"
                                                        onClick={() => eliminarReserva(reserva.id)}>
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
