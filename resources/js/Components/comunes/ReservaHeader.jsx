import React from 'react';
import { Link } from '@inertiajs/react';
import { formatearFecha } from '@/utils/formatters';

export default function ReservaHeader({ reserva, isCancelled, onOpenDateModal }) {
    return (
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-6 md:flex-row md:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">
                            Reserva{' '}
                            <span className="font-mono text-gray-400">
                                {reserva.localizador}
                            </span>
                        </h1>

                        {/* Estado de reserva */}
                        <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                        >
                            {reserva.status}
                        </span>

                        {/* Estado de pago: mostrar junto al estado de la reserva */}
                        {reserva.pago && (
                            <span
                                className={`ml-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                    reserva.pago === 'pagado' ? 'bg-green-100 text-green-700' : reserva.pago === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {reserva.pago}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                        {reserva.cliente?.nombre} • {formatearFecha(reserva.check_in)} al {formatearFecha(reserva.check_out)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isCancelled && (
                        <button
                            onClick={onOpenDateModal}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Modificar Fechas
                        </button>
                    )}
                    <Link
                        href="/"
                        className="text-sm font-bold text-gray-500 hover:text-gray-700"
                    >
                        Cerrar
                    </Link>
                </div>
            </div>
        </header>
    );
}
