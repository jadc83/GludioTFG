import React from 'react';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';

export default function ReservaInfo({ reserva }) {
    if (!reserva) return null;

    const qrData = encodeURIComponent(reserva.localizador || '');
    const qrSize = 160;
    // Use api.qrserver.com which is simple and reliable for dev environments
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${qrData}`;
    const fallbackSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${qrSize}' height='${qrSize}'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%237a0202' font-family='Arial' font-size='14'>QR</text></svg>`);

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <h3 className="text-sm font-black tracking-tight text-gray-900">Resumen de reserva</h3>
                    <p className="mt-2 text-sm text-gray-600">Localizador: <span className="font-mono text-gray-800">{reserva.localizador}</span></p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                        <div>
                            <div className="text-xs font-bold text-gray-500">Huésped</div>
                            <div className="mt-1 font-medium">{reserva.cliente?.name || 'N/A'}</div>
                            {reserva.cliente?.email && <div className="text-xs text-gray-500">{reserva.cliente.email}</div>}
                            {reserva.cliente?.telefono && <div className="text-xs text-gray-500">{reserva.cliente.telefono}</div>}
                            {reserva.cliente?.direccion && <div className="text-xs text-gray-500">{reserva.cliente.direccion}</div>}
                        </div>

                                        {(() => {
                                            const bookedName = reserva.booked_by_user?.name || null;
                                            const bookedEmail = reserva.booked_by_user?.email || null;
                                            const clientName = reserva.cliente?.name || reserva.cliente?.nombre || null;
                                            const clientEmail = reserva.cliente?.email || null;

                                            const isSamePerson = (bookedName && clientName && bookedName === clientName) || (bookedEmail && clientEmail && bookedEmail === clientEmail);

                                            if (!bookedName) return null;

                                            // Only show "Reservado por" if it's a different person than the guest
                                            if (isSamePerson) return null;

                                            return (
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500">Reservado por</div>
                                                    <div className="mt-1 font-medium">{reserva.booked_by_user?.name || 'Sistema'}</div>
                                                    {reserva.booked_by_user?.email && <div className="text-xs text-gray-500">{reserva.booked_by_user.email}</div>}
                                                </div>
                                            );
                                        })()}

                        <div>
                            <div className="text-xs font-bold text-gray-500">Check-In</div>
                            <div className="mt-1 font-medium">{formatearFecha(reserva.check_in)} {reserva.check_in_time ? `· ${reserva.check_in_time}` : ''}</div>
                            {reserva.check_in_full && <div className="text-xs text-gray-400">{reserva.check_in_full}</div>}
                        </div>

                        <div>
                            <div className="text-xs font-bold text-gray-500">Check-Out</div>
                            <div className="mt-1 font-medium">{formatearFecha(reserva.check_out)} {reserva.check_out_time ? `· ${reserva.check_out_time}` : ''}</div>
                            {reserva.check_out_full && <div className="text-xs text-gray-400">{reserva.check_out_full}</div>}
                        </div>

                        <div className="col-span-2">
                            <div className="text-xs font-bold text-gray-500">Tarifa</div>
                            {reserva.tarifa ? (
                                <div className="mt-1 text-sm text-gray-700">{reserva.tarifa.name} {reserva.tarifa.price ? <span className="text-gray-500">· {formatearMoneda(reserva.tarifa.price)}</span> : null}</div>
                            ) : (
                                <div className="mt-1 text-sm text-gray-500">No especificada</div>
                            )}
                        </div>

                        <div className="col-span-2 flex items-center justify-between mt-3">
                            <a
                                href={reserva?.localizador ? route('reservas.descargar-comprobante', { localizador: reserva.localizador }) : '#'}
                                className="rounded-md bg-[#7a0202] px-4 py-2 text-white text-sm font-bold"
                                onClick={(e) => { if (!reserva?.localizador) { e.preventDefault(); } }}
                            >
                                Descargar comprobante
                            </a>

                            <div className="flex items-center gap-4">
                                <img
                                    src={qrUrl}
                                    alt="QR"
                                    className="h-20 w-20 rounded-md border"
                                    onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml;utf8,${fallbackSvg}`; }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
