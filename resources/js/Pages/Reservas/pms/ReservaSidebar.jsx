import { formatearMoneda } from '@/utils/formatters';

export default function ReservaSidebar({ reserva, estaCancelada, onSolicitarReembolso }) {
    return (
        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
            <div className="rounded-3xl bg-[#7a0202] p-8 text-white shadow-xl shadow-red-100">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                    Total a cobrar
                </h4>
                <div className="mb-8 text-4xl font-black leading-none">
                    {formatearMoneda(reserva.precio_total)}
                </div>

                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm">
                        <span className="font-medium opacity-70">Pago inicial</span>
                        <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">{reserva.pago}</span>
                    </div>
                    {reserva.reembolsos_total > 0 && (
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm text-red-200">
                            <span className="font-medium">Total Reembolsado</span>
                            <span className="font-black">-{formatearMoneda(reserva.reembolsos_total)}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {!estaCancelada && reserva.status === 'pendiente' && (
                        <button
                            onClick={() => (window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkin`)}
                            className="w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-[#7a0202] shadow-lg shadow-black/10 transition hover:bg-gray-100"
                        >
                            Hacer Check-In
                        </button>
                    )}

                    {!estaCancelada && reserva.status !== 'checked_out' && (
                        <button
                            onClick={() => (window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkout`)}
                            className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-black/40"
                        >
                            Hacer Check-Out
                        </button>
                    )}
                </div>
            </div>

            {!estaCancelada && reserva.pago === 'pagado' && (
                <button
                    onClick={onSolicitarReembolso}
                    className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:border-red-200 hover:text-red-600"
                >
                    Solicitar Reembolso
                </button>
            )}
        </aside>
    );
}
