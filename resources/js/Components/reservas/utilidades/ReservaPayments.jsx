import React from 'react';
import { formatearMoneda } from '@/utils/formatters';
import PriceSummary from '@/Components/reservas/comunes/PriceSummary';

export default function ReservaPayments({ reserva, estaCancelada, onSolicitarReembolso }) {
    return (
        <div className="rounded-3xl bg-[#7a0202] p-8 text-white shadow-xl shadow-red-100">
            <PriceSummary total={reserva?.precio_total} refunds={reserva?.reembolsos_total} big />

            <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm">
                    <span className="font-medium opacity-70">Pago inicial</span>
                    <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">{reserva?.pago}</span>
                </div>
            </div>

            <div className="space-y-3">
                {!estaCancelada && reserva?.status === 'pendiente' && (
                    <button
                        onClick={() => (window.location.href = route('scan-qr') + `?localizador=${reserva?.localizador}&action=checkin`)}
                        className="w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-[#7a0202] shadow-lg shadow-black/10 transition hover:bg-gray-100"
                    >
                        Hacer Check-In
                    </button>
                )}

                {!estaCancelada && reserva?.status !== 'checked_out' && (
                    <button
                        onClick={() => (window.location.href = route('scan-qr') + `?localizador=${reserva?.localizador}&action=checkout`)}
                        className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-black/40"
                    >
                        Hacer Check-Out
                    </button>
                )}
            </div>

            {!estaCancelada && reserva?.pago === 'pagado' && (
                <button
                    onClick={onSolicitarReembolso}
                    className="mt-4 w-full rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:border-red-200 hover:text-red-600"
                >
                    Solicitar Reembolso
                </button>
            )}
        </div>
    );
}
