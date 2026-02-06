import React from 'react';
import { formatearMoneda } from '@/utils/formatters';

export default function PriceSummary({ total = 0, refunds = 0, big = false }) {
    const totalNumber = Number(total || 0);
    const refundsNumber = Number(refunds || 0);

    if (big) {
        return (
            <div>
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total a cobrar</div>
                <div className="mb-4 text-4xl font-black leading-none">{formatearMoneda(totalNumber)}</div>
                {refundsNumber > 0 && (
                    <div className="text-sm text-red-200">Total Reembolsado <span className="font-black">-{formatearMoneda(refundsNumber)}</span></div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="text-xs font-black uppercase text-gray-400">Total</div>
            <div className="font-black text-lg">{formatearMoneda(totalNumber)}</div>
            {refundsNumber > 0 && (
                <div className="text-xs text-gray-500">Reembolsos: -{formatearMoneda(refundsNumber)}</div>
            )}
        </div>
    );
}
