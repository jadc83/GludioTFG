import Campo from '@/Components/reservas/utilidades/Campo';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import {
    CheckCircleIcon,
    DocumentArrowDownIcon,
    InformationCircleIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function BuscadorReserva() {
    const [localizador, setLocalizador] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [reserva, setReserva] = useState(null);
    const [error, setError] = useState('');

    const handleBuscar = async (e) => {
        e.preventDefault();

        if (!localizador.trim()) {
            setError('Por favor ingresa un localizador');
            return;
        }

        setBuscando(true);
        setError('');
        setReserva(null);

        try {
            const service = await import('@/hooks/reservas/service');
            const r = await service.buscarReserva(localizador.trim());
            if (!r) {
                setError('No se encontró la reserva');
                setReserva(null);
            } else {
                setReserva(r);
            }
        } catch (err) {
            setError('Error al buscar la reserva');
            setReserva(null);
        } finally {
            setBuscando(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            pendiente: 'badge-warning',
            confirmada: 'badge-info',
            completada: 'badge-success',
            cancelada: 'badge-error',
        };
        return colors[status] || 'badge-gray';
    };

    const getPagoBadge = (reserva) => {
        const reembolsos = reserva.reembolsos_total || 0;
        if (
            reembolsos > 0 &&
            reserva.precio_total &&
            reembolsos < reserva.precio_total
        )
            return 'badge-warning';
        const colors = {
            pendiente: 'badge-warning',
            pagado: 'badge-success',
            fallido: 'badge-error',
        };
        return colors[reserva.pago] || 'badge-gray';
    };

    return (
        <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-3xl font-bold text-gray-800">
                        Busca tu Reserva
                    </h2>
                    <p className="text-gray-600">
                        Ingresa tu número de localizador para ver los detalles
                    </p>
                </div>

                <form onSubmit={handleBuscar} className="mb-6">
                    <div className="flex gap-2">
                        <Campo
                            id="localizador_buscar"
                            name="localizador"
                            value={localizador}
                            onChange={(e) =>
                                setLocalizador(e.target.value.toUpperCase())
                            }
                            placeholder="Ej: GZ02JMV"
                            className="input-bordered input flex-1"
                            disabled={buscando}
                        />
                        <button
                            type="submit"
                            disabled={buscando}
                            className="btn btn-primary gap-2"
                        >
                            <MagnifyingGlassIcon className="h-5 w-5" />
                            {buscando ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="alert alert-error mb-6 shadow-lg">
                        <InformationCircleIcon className="h-6 w-6" />
                        <span>{error}</span>
                    </div>
                )}

                {reserva && (
                    <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg">
                        <div className="mb-6 flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {reserva.cliente.nombre}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Localizador:{' '}
                                    <span className="font-mono font-bold">
                                        {reserva.localizador}
                                    </span>
                                </p>
                            </div>
                            <CheckCircleIcon className="h-8 w-8 text-green-500" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-600">Entrada</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {formatearFecha(reserva.check_in)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Salida</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {formatearFecha(reserva.check_out)}
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <p className="mb-3 text-sm font-semibold text-gray-700">
                                Habitaciones
                            </p>
                            <div className="space-y-2">
                                {reserva.habitaciones.map((hab, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between rounded-md bg-gray-50 p-2"
                                    >
                                        <span className="text-gray-700">
                                            {hab.tipo} - Habitación {hab.numero}
                                        </span>
                                        <span className="font-semibold text-gray-800">
                                            {formatearMoneda(hab.precio)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="mb-4 flex justify-between">
                                <span className="text-lg font-bold text-gray-800">
                                    Total:
                                </span>
                                <span className="text-2xl font-bold text-primary">
                                    {formatearMoneda(reserva.precio_total)}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <div>
                                    <p className="mb-1 text-xs font-semibold text-gray-600">
                                        Estado
                                    </p>
                                    <span
                                        className={`badge ${getStatusBadge(reserva.status)}`}
                                    >
                                        {reserva.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            reserva.status.slice(1)}
                                    </span>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-semibold text-gray-600">
                                        Pago
                                    </p>
                                    <span
                                        className={`badge ${getPagoBadge(reserva)}`}
                                    >
                                        {reserva.reembolsos_total > 0 &&
                                        reserva.reembolsos_total <
                                            reserva.precio_total
                                            ? 'Parcialmente reembolsado'
                                            : reserva.pago
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              reserva.pago.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    (window.location.href = `/reservas/${reserva.localizador}/pdf`)
                                }
                                className="btn btn-primary btn-outline mt-6 w-full gap-2"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 bg-transparent" />
                                Descargar Comprobante PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
