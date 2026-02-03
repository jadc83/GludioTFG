import LoadingSpinner from '@/Components/UI/LoadingSpinner';

export default function ModalFechas({
    mostrar,
    modalCheckIn,
    modalCheckOut,
    setModalCheckIn,
    setModalCheckOut,
    isCheckedIn,
    vistaPrevia,
    cargandoVistaPrevia,
    errorVistaPrevia,
    onCerrar,
    onConfirmar,
    procesando,
}) {
    if (!mostrar) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="animate-in fade-in zoom-in w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 p-8">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Cambiar Fechas</h2>
                    <button onClick={onCerrar} className="font-bold text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="space-y-6 p-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Entrada</label>
                            <input
                                type="date"
                                disabled={isCheckedIn}
                                value={modalCheckIn}
                                onChange={(e) => setModalCheckIn(e.target.value)}
                                className="w-full rounded-xl border-gray-200 bg-gray-50 font-bold focus:border-[#7a0202] focus:ring-[#7a0202]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Salida</label>
                            <input
                                type="date"
                                value={modalCheckOut}
                                onChange={(e) => setModalCheckOut(e.target.value)}
                                className="w-full rounded-xl border-gray-200 bg-gray-50 font-bold focus:border-[#7a0202] focus:ring-[#7a0202]"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        {cargandoVistaPrevia ? (
                            <div className="py-4 text-center">
                                <LoadingSpinner />
                                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">Calculando cambios...</div>
                            </div>
                        ) : errorVistaPrevia ? (
                            <div className="py-4 text-center text-sm font-bold text-red-500">{errorVistaPrevia}</div>
                        ) : (
                            vistaPrevia && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Diferencia Total</span>
                                        <span className={`text-2xl font-black ${vistaPrevia.estimate_charge > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {vistaPrevia.estimate_charge > 0 ? '+' : ''}{vistaPrevia.estimate_charge > 0 ? `€${vistaPrevia.estimate_charge.toFixed(2)}` : `€${vistaPrevia.estimate_charge.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Estado</span>
                                        <span className={`text-xs font-black uppercase ${vistaPrevia.available ? 'text-green-600' : 'text-red-600'}`}>{vistaPrevia.available ? '✓ Disponible' : '✕ No disponible'}</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="flex gap-3 bg-gray-50 p-8">
                    <button onClick={onCerrar} className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:bg-white/50">Cancelar</button>
                    <button disabled={!vistaPrevia?.available || procesando} onClick={onConfirmar} className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] disabled:opacity-50">{procesando ? 'Procesando...' : 'Aplicar Cambios'}</button>
                </div>
            </div>
        </div>
    );
}
