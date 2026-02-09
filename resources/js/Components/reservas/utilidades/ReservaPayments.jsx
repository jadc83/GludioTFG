import React from 'react';

export default function ReservaPayments({ reserva, estaCancelada, onSolicitarReembolso }) {
    return (
        <div className="rounded-3xl bg-[#7a0202] p-8 text-white shadow-xl shadow-red-100">
            {/* Sidebar now only contains status / small info; total and actions moved to ReservaInfo */}
            <div className="flex flex-col gap-4">
                <div className="text-sm font-medium opacity-80">Estado</div>
                <div className="text-lg font-black">{reserva?.status ?? '—'}</div>
                {reserva?.pago && <div className="text-xs rounded bg-white/10 px-2 py-1 inline-block">{reserva.pago}</div>}
            </div>
        </div>
    );
}
