import React from 'react';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import dayjs from 'dayjs';
import PriceSummary from '@/Components/reservas/comunes/PriceSummary';

export default function ReservaSummary({ reserva = {} }) {
    const nights = reserva.check_in && reserva.check_out
        ? dayjs(reserva.check_out).diff(dayjs(reserva.check_in), 'day')
        : null;

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Resumen</h4>
            <div className="space-y-3 text-sm">
                <div>
                    <div className="text-xs font-black uppercase text-gray-400">Huésped</div>
                    <div className="font-bold">{reserva.cliente?.nombre || '—'}</div>
                </div>
                <div>
                    <div className="text-xs font-black uppercase text-gray-400">Fechas</div>
                    <div>{reserva.check_in ? formatearFecha(reserva.check_in) : '—'} − {reserva.check_out ? formatearFecha(reserva.check_out) : '—'}</div>
                    {nights !== null && <div className="text-xs text-gray-400">{nights} noche{nights !== 1 ? 's' : ''}</div>}
                </div>
                <div>
                    <PriceSummary total={reserva.precio_total} refunds={reserva.reembolsos_total} />
                </div>
            </div>
        </section>
    );
}
