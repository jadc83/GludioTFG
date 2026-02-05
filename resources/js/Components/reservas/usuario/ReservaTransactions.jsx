import React from 'react';
import { formatearMoneda } from '@/utils/formatters';

export default function ReservaTransactions({ pagos = [], reembolsos = [] }) {
    if ((!pagos || pagos.length === 0) && (!reembolsos || reembolsos.length === 0)) return null;

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Transacciones</h4>

            <div className="space-y-4 text-sm">
                {pagos && pagos.length > 0 && (
                    <div>
                        <div className="mb-2 text-xs font-black uppercase text-gray-400">Pagos</div>
                        <ul className="space-y-2">
                            {pagos.map((p) => (
                                <li key={p.id} className="flex items-center justify-between">
                                    <div className="text-sm font-bold">#{p.id} <span className="text-xs font-medium text-gray-500">{p.estado}</span></div>
                                    <div className="text-sm font-black">{formatearMoneda(p.monto)}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {reembolsos && reembolsos.length > 0 && (
                    <div>
                        <div className="mb-2 text-xs font-black uppercase text-gray-400">Reembolsos</div>
                        <ul className="space-y-2">
                            {reembolsos.map((r) => (
                                <li key={r.id} className="flex items-center justify-between">
                                    <div className="text-sm font-bold">#{r.id} <span className="text-xs font-medium text-gray-500">{r.reason_code || ''}</span></div>
                                    <div className="text-sm font-black">-{formatearMoneda(r.monto)}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}
