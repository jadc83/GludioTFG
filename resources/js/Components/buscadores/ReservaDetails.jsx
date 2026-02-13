import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { CheckCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import HabitacionItem from './HabitacionItem';
import router from '@inertiajs/router';

export default function ReservaDetails({ reserva, getStatusBadge, getPagoBadge }) {
    return (
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{reserva.cliente.nombre}</h3>
                    <p className="text-sm text-gray-500">
                        Localizador:{' '}
                        <span className="font-mono font-bold">{reserva.localizador}</span>
                    </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <p className="text-sm text-gray-600">Entrada</p>
                    <p className="text-lg font-semibold text-gray-800">{formatearFecha(reserva.check_in)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Salida</p>
                    <p className="text-lg font-semibold text-gray-800">{formatearFecha(reserva.check_out)}</p>
                </div>
            </div>

            <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">Habitaciones</p>
                <div className="space-y-2">
                    {reserva.habitaciones.map((hab, idx) => (
                        <HabitacionItem key={idx} hab={{...hab, precio_formateado: formatearMoneda(hab.precio)}} />
                    ))}
                </div>
            </div>

            <div className="border-t pt-4">
                <div className="mb-4 flex justify-between">
                    <span className="text-lg font-bold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-primary">{formatearMoneda(reserva.precio_total)}</span>
                </div>

                <div className="flex gap-2">
                    <div>
                        <p className="mb-1 text-xs font-semibold text-gray-600">Estado</p>
                        <span className={`badge ${getStatusBadge(reserva.status)}`}>
                            {reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}
                        </span>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-semibold text-gray-600">Pago</p>
                        <span className={`badge ${getPagoBadge(reserva)}`}>
                            {reserva.reembolsos_total > 0 && reserva.reembolsos_total < reserva.precio_total
                                ? 'Parcialmente reembolsado'
                                : reserva.pago.charAt(0).toUpperCase() + reserva.pago.slice(1)}
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => router.visit(`/reservas/${reserva.localizador}/pdf`)}
                    className="btn btn-primary btn-outline mt-6 w-full gap-2"
                >
                    <DocumentArrowDownIcon className="h-5 w-5 bg-transparent" />
                    Descargar Comprobante PDF
                </button>
            </div>
        </div>
    );
}
