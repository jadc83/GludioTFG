import React from 'react';

const STATUS_MAP = {
    pending: { clase: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Pendiente' },
    approved: { clase: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Aprobado' },
    processed: { clase: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Procesado' },
    rejected: { clase: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Rechazado' },
    default: { clase: 'bg-gray-50 text-gray-500 border-gray-100', label: 'Desconocido' },
};

export default function RefundStatusBadge({ status }) {
    const cfg = STATUS_MAP[status] || STATUS_MAP.default;
    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${cfg.clase}`}>
            {cfg.label}
        </span>
    );
}
