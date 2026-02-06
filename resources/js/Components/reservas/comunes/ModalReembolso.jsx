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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md rounded-3xl bg-white shadow-2xl duration-300">
                <div className="border-b border-gray-100 p-8">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Solicitar Reembolso</h2>
                </div>
                <div className="space-y-6 p-8">
                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monto a reembolsar</span>
                        <div className="mt-1 text-4xl font-black text-[#7a0202]">{formatearMoneda(monto)}</div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400">Motivo de la solicitud</label>
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
                                        checked={motivoReembolso === r.value}
                                        onChange={() => setMotivoReembolso(r.value)}
                                        className="text-[#7a0202] focus:ring-[#7a0202]"
                                    />
                                    <span className="text-sm font-bold text-gray-700">{r.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={notasReembolso}
                        onChange={(e) => setNotasReembolso(e.target.value)}
                        placeholder="Notas adicionales..."
                        className="min-h-[100px] w-full rounded-xl border-gray-100 bg-gray-50 p-4 text-sm focus:ring-[#7a0202]"
                    />
                </div>
                <div className="flex gap-3 bg-gray-50 p-8">
                    <button
                        onClick={onEnviar}
                        disabled={procesando}
                        className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-100 transition disabled:opacity-50"
                    >
                        {procesando ? 'Enviando...' : 'Confirmar'}
                    </button>
                    <button
                        onClick={onCerrar}
                        className="ml-3 rounded-2xl py-4 px-6 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:text-gray-700"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
