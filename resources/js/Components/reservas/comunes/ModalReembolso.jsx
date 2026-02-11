import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { t } from '@/i18n';
import { formatearMoneda } from '@/utils/formatters';

export default function ModalReembolso({
    mostrar,
    monto,
    motivosReembolso,
    motivoReembolso,
    setMotivoReembolso,
    notasReembolso,
    setNotasReembolso,
    onCerrar,
    onEnviar,
    procesando,
}) {
    if (!mostrar) return null;
    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-reembolso-title"
        >
            <div
                className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl duration-300"
                role="document"
            >
                <div className="bg-[#7a0202] p-6">
                    <h2
                        id="modal-reembolso-title"
                        className="text-lg font-black uppercase tracking-tight text-white"
                    >
                        Solicitar Reembolso
                    </h2>
                </div>
                {procesando ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                        <LoadingSpinner size="loading-lg" />
                        <div className="text-lg font-bold text-gray-700">
                            {t('edit_reserva.refund_processing')}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 bg-white p-6">
                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {t('edit_reserva.refund_amount')}
                            </span>
                            <div className="mt-1 text-4xl font-black text-[#7a0202]">
                                {formatearMoneda(monto)}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                {t('edit_reserva.refund_reason_label')}
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {motivosReembolso.map((r) => (
                                    <label
                                        key={r.value}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${motivoReembolso === r.value ? 'border-[#7a0202] bg-red-50' : 'border-gray-50 hover:bg-gray-50'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={r.value}
                                            checked={
                                                motivoReembolso === r.value
                                            }
                                            onChange={() =>
                                                setMotivoReembolso(r.value)
                                            }
                                            className="text-[#7a0202] focus:ring-[#7a0202]"
                                        />
                                        <span className="text-sm font-bold text-gray-700">
                                            {r.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={notasReembolso}
                            onChange={(e) => setNotasReembolso(e.target.value)}
                            placeholder={t(
                                'edit_reserva.refund_notes_placeholder',
                            )}
                            className="min-h-[100px] w-full rounded-xl border-gray-100 bg-gray-50 p-4 text-sm focus:ring-[#7a0202]"
                        />
                    </div>
                )}
                <div className="flex gap-3 border-t border-gray-100 bg-white p-6">
                    <button
                        onClick={onEnviar}
                        aria-label={
                            procesando
                                ? 'Enviando reembolso'
                                : 'Confirmar reembolso'
                        }
                        disabled={procesando}
                        className="flex-1 rounded-2xl bg-[#7a0202] py-3 text-sm font-black uppercase tracking-widest text-white shadow transition disabled:opacity-50"
                    >
                        {procesando
                            ? t('edit_reserva.sending')
                            : t('edit_reserva.confirm')}
                    </button>
                    <button
                        onClick={onCerrar}
                        aria-label="Cancelar reembolso"
                        className="ml-3 rounded-2xl border border-gray-100 bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest text-gray-600 transition hover:text-gray-900"
                    >
                        {t('edit_reserva.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
}
