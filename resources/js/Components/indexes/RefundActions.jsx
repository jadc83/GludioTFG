import React from 'react';
import { CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function RefundActions({ refund, onApprove, onReject, onDelete }) {
    if (refund.status !== 'pending') {
        return <span className="text-[10px] font-black uppercase italic text-gray-300">Archivado</span>;
    }

    return (
        <div className="flex justify-end gap-2">
            <button onClick={() => onApprove && onApprove(refund.id)} className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 shadow-sm transition hover:bg-emerald-100" title="Aprobar Reembolso">
                <CheckIcon className="h-4 w-4" />
            </button>
            <button onClick={() => onReject && onReject(refund.id)} className="rounded-xl bg-rose-50 p-2.5 text-rose-600 shadow-sm transition hover:bg-rose-100" title="Rechazar">
                <XMarkIcon className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete && onDelete(refund.id)} className="rounded-xl bg-gray-50 p-2.5 text-gray-400 shadow-sm transition hover:text-black" title="Eliminar registro">
                <TrashIcon className="h-4 w-4" />
            </button>
        </div>
    );
}
