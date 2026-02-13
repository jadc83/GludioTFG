import Badge from '@/Components/UI/Badge';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';

export default function ReservaFila({ reserva, eliminandoId, eliminarReserva }) {
    const visiblePrice =
        typeof reserva.ultimo_pago_monto === 'number' && reserva.ultimo_pago_monto !== null
            ? parseFloat(reserva.ultimo_pago_monto)
            : reserva.pagos && reserva.pagos.length
            ? parseFloat(reserva.pagos[reserva.pagos.length - 1].monto)
            : parseFloat(reserva.precio_total || 0);

    return (
        <tr key={reserva.id} className="group transition-colors hover:bg-gray-50/50">
            <td className="px-6 py-6 text-center" data-label="Localizador">
                <div className="flex w-full items-center justify-end justify-center gap-3 md:justify-center">
                    <div className="flex h-10 w-16 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-colors group-hover:bg-[#7a0202]">
                        <span className="font-mono text-xs font-black tracking-tighter">{reserva.localizador}</span>
                    </div>
                </div>
            </td>

            <td className="px-6 py-6 text-center" data-label="Cliente">
                <span className="text-xs font-medium uppercase leading-none tracking-tight text-gray-900">{reserva.cliente_name || 'Anónimo'}</span>
            </td>

            <td className="px-6 py-6 text-center" data-label="Habitación">
                <span className="text-sm font-medium text-gray-600">{reserva.habitacion_numero || '—'}</span>
            </td>

            <td className="px-6 py-6 text-center" data-label="Llegada">
                <div className="font-mono text-xs font-medium text-gray-600">{new Date(reserva.check_in).toLocaleDateString('es-ES')}</div>
            </td>

            <td className="px-6 py-6 text-center" data-label="Salida">
                <div className="font-mono text-xs font-medium text-gray-600">{new Date(reserva.check_out).toLocaleDateString('es-ES')}</div>
            </td>

            <td className="px-6 py-6 text-center" data-label="Precio">
                <div className="flex w-full flex-col items-end md:items-center">
                    <span className="text-xs text-gray-400 line-through">{(parseFloat(reserva.precio_total || 0) + parseFloat(reserva.descuento_aplicado || 0)).toFixed(2)} €</span>
                    <span className="text-xs font-bold text-gray-900">{visiblePrice.toFixed(2)} €</span>
                </div>
            </td>

            <td className="px-6 py-6 text-center" data-label="Estado Pago">
                <div className="flex w-full justify-end md:justify-center">
                    {(() => {
                        const pagos = reserva.pagos || [];
                        const pagoReembolsado = pagos.find((p) => (p.reembolso_estado === 'completo') || (p.estado === 'cancelado'));
                        if (pagoReembolsado) return <Badge label={'Devuelto'} tipo={'devuelto'} />;

                        const ultimoPago = pagos.length ? pagos[pagos.length - 1] : null;
                        if (ultimoPago) {
                            if (ultimoPago.reembolso_estado === 'parcial_procesado') return <Badge label={'Parcialmente Reembolsado'} tipo={'reembolso_parcial'} />;
                            if (ultimoPago.estado === 'completado' || ultimoPago.estado === 'pagado') return <Badge label={'Pagado'} tipo={'completado'} />;
                            if (ultimoPago.estado === 'procesando') return <Badge label={'Procesando'} tipo={'procesando'} />;
                        }

                        return (
                            <Badge
                                label={
                                    reserva.pago === 'pagado'
                                        ? 'Pagado'
                                        : reserva.pago === 'devuelto'
                                        ? 'Devuelto'
                                        : reserva.pago === 'reembolso_pendiente'
                                        ? 'Reembolso Pendiente'
                                        : reserva.pago === 'reembolso_parcial_procesado'
                                        ? 'Parcialmente Reembolsado'
                                        : 'Pendiente'
                                }
                                tipo={reserva.pago || 'pendiente'}
                            />
                        );
                    })()}
                </div>
            </td>

            <td className="px-6 py-6 text-center" data-label="Estado Reserva">
                <div className="flex w-full justify-end md:justify-center">
                    <Badge
                        label={
                            reserva.status === 'confirmado'
                                ? 'Confirmada'
                                : reserva.status === 'checked_in'
                                ? 'En Estancia'
                                : reserva.status === 'checked_out'
                                ? 'Finalizada'
                                : reserva.status === 'cancelado'
                                ? 'Cancelada'
                                : reserva.status === 'no_presentado'
                                ? 'No Presentado'
                                : reserva.status === 'pendiente'
                                ? 'Pendiente'
                                : reserva.status === 'reembolso_parcial_pendiente'
                                ? 'Reembolso Parcial Pendiente'
                                : reserva.status === 'reembolso_total_pendiente'
                                ? 'Reembolso Total Pendiente'
                                : reserva.status === 'reembolso_parcial_confirmado'
                                ? 'Reembolso Parcial'
                                : 'Pendiente'
                        }
                        tipo={reserva.status || 'pendiente'}
                    />
                </div>
            </td>

            <td className="full-width mt-2 px-6 py-6 text-right md:mt-0" data-label="Acciones">
                <div className="flex w-full justify-end gap-2">
                    <button
                        onClick={() => router.visit(`/reservas/${reserva.id}/edit`)}
                        className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:border-red-100 hover:text-[#7a0202]"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => eliminarReserva(reserva.id)}
                        disabled={eliminandoId === reserva.id}
                        className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:text-black disabled:opacity-50"
                    >
                        {eliminandoId === reserva.id ? <LoadingSpinner /> : <TrashIcon className="h-4 w-4" />}
                    </button>
                </div>
            </td>
        </tr>
    );
}
