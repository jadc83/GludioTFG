import React from 'react';
import { format } from 'date-fns';
import RefundStatusBadge from '@/Components/indexes/RefundStatusBadge';
import RefundActions from '@/Components/indexes/RefundActions';

export default function ReembolsosTable({ refunds = [], onApprove, onReject, onDelete }) {
    return (
        <div className="overflow-x-auto">
            <table className="responsive-table w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Referencia</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Reserva</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Monto Solicitado</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Motivo y Notas</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {refunds.map((r) => (
                        <tr key={r.id} className="group transition-colors hover:bg-gray-50/50">
                            <td className="px-6 py-6" data-label="Referencia">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
                                        <span className="font-mono text-xs font-black text-gray-500">#{r.id}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-gray-300">{r.created_at ? format(new Date(r.created_at), 'dd/MM/yy') : '--'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-6" data-label="Reserva / Usuario">
                                <div className="flex flex-col">
                                    <div className="mb-1 flex items-center gap-2">
                                        <div className="rounded bg-gray-900 px-2 py-0.5 font-mono text-[10px] font-black tracking-tighter text-white">{r.reserva?.localizador ?? r.reserva_id}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-6" data-label="Monto Solicitado">
                                <div className="flex flex-col">
                                    <span className="text-base font-black text-[#7a0202]">{r.requested_amount_cents != null ? `${(r.requested_amount_cents / 100).toFixed(2)}€` : r.reserva ? `${((r.reserva.precio_total ?? 0) - (r.reserva.reembolsos_total ?? 0)).toFixed(2)}€` : '—'}</span>
                                    {r.processed_refund && <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600">Procesado: €{(r.processed_refund.amount_cents / 100).toFixed(2)}</span>}
                                </div>
                            </td>
                            <td className="px-6 py-6" data-label="Motivo y Notas">
                                <div className="max-w-[200px]">
                                    <p className="truncate text-xs italic text-gray-500" title={r.notes}>{r.notes || 'Sin observaciones adicionales.'}</p>
                                </div>
                            </td>
                            <td className="px-6 py-6 text-center" data-label="Estado"><RefundStatusBadge status={r.status} /></td>
                            <td className="px-6 py-6 text-right" data-label="Acciones"><RefundActions refund={r} onApprove={onApprove} onReject={onReject} onDelete={onDelete} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
