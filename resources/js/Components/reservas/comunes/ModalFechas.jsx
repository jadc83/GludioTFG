import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { formatearMoneda } from '@/utils/formatters';

export default function ModalFechas({
    mostrar,
    modalCheckIn,
    modalCheckOut,
    setModalCheckIn,
    setModalCheckOut,
    isCheckedIn,
    vistaPrevia,
    vistaPreviaCargada,
    cargandoVistaPrevia,
    errorVistaPrevia,
    onCerrar,
    onConfirmar,
    procesando,
    reserva,
}) {
    if (!mostrar) return null;

    const renderDiferencia = () => {
        if (!vistaPrevia) return null;
        const delta = Number(vistaPrevia.nuevo_total) - Number(vistaPrevia.viejo_total);
        if (delta > 0) {
            // se debe pagar
            return (
                <div>
                    <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">A pagar ahora</span>
                    <span className="text-2xl font-black text-red-600">+{formatearMoneda(vistaPrevia.estimate_charge)}</span>
                </div>
            );
        }

        // reducción de estancia -> posible reembolso
        const rawRefund = Math.max(0, Number(vistaPrevia.viejo_total) - Number(vistaPrevia.nuevo_total));
        const penalizacion = Number(vistaPrevia.penalizacion || 0);
        const finalRefund = Number(vistaPrevia.estimate_refund || 0);

        if (finalRefund > 0) {
            return (
                <div>
                    <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Reembolso estimado</span>
                    <span className="text-2xl font-black text-green-600">-{formatearMoneda(finalRefund)}</span>
                    {penalizacion > 0 && (
                        <div className="mt-1 text-xs text-gray-400">Penalización aplicada: {formatearMoneda(penalizacion)}</div>
                    )}
                </div>
            );
        }

        // No hay reembolso final (penalización cubre la diferencia)
        return (
            <div>
                <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Diferencia</span>
                <span className="text-2xl font-black text-green-600">-{formatearMoneda(rawRefund)}</span>
                {penalizacion > 0 && (
                    <div className="mt-1 text-xs text-gray-400">No hay reembolso tras aplicar penalización de {formatearMoneda(penalizacion)}</div>
                )}
            </div>
        );
    };

    const renderPorNoche = () => {
        if (!vistaPrevia) return null;
        const extra = Number(vistaPrevia.extra_nights || 0);
        const removed = Number(vistaPrevia.removed_nights || 0);
        const per = Number(vistaPrevia.per_night_change || 0);
        const perNet = Number(vistaPrevia.per_night_net || 0);
        if (extra > 0) {
            return (
                <div className="mt-3 text-sm text-gray-700">
                    <div className="font-bold">Precio por noche extra</div>
                    <div className="text-lg text-red-600">+{formatearMoneda(per)} / noche ({extra} noche{extra > 1 ? 's' : ''})</div>
                </div>
            );
        }
        if (removed > 0) {
            return (
                <div className="mt-3 text-sm text-gray-700">
                    <div className="font-bold">A devolver por noche</div>
                    <div className="text-lg text-green-600">-{formatearMoneda(per)} / noche ({removed} noche{removed > 1 ? 's' : ''})</div>
                    {perNet >= 0 && perNet !== per && (
                        <div className="mt-1 text-xs text-gray-400">Neto por noche tras penalización: {formatearMoneda(perNet)}</div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="animate-in fade-in zoom-in w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 p-8">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Cambiar Fechas</h2>
                    <button onClick={onCerrar} className="font-bold text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="space-y-6 p-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total a cobrar</div>
                            <div className="text-2xl font-black text-gray-900">{formatearMoneda(vistaPrevia?.nuevo_total ?? reserva?.precio_total ?? 0)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase opacity-60">Pago inicial</div>
                            <div className="mt-1 inline-block rounded bg-gray-100 px-3 py-1 text-xs font-black uppercase text-gray-700">{reserva?.pago ?? 'pendiente'}</div>
                        </div>
                    </div>
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
                            <div className="py-4 text-center text-sm font-bold text-red-500">{typeof errorVistaPrevia === 'string' ? errorVistaPrevia : (errorVistaPrevia?.message || String(errorVistaPrevia))}</div>
                        ) : !vistaPreviaCargada ? (
                            <div className="py-6 text-center text-sm text-gray-500">Selecciona las nuevas fechas para ajustar el importe</div>
                        ) : vistaPrevia ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    {renderDiferencia()}
                                    {renderPorNoche()}
                                </div>

                                <div className="text-right">
                                    <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Estado</span>
                                    <span className={`text-xs font-black uppercase ${vistaPrevia.available ? 'text-green-600' : 'text-red-600'}`}>{vistaPrevia.available ? '✓ Disponible' : '✕ No disponible'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center text-sm text-gray-500">No hay datos para esas fechas</div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 bg-gray-50 p-8">
                    <button onClick={onCerrar} className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:bg-white/50">Cancelar</button>
                    <button disabled={!vistaPreviaCargada || !vistaPrevia?.available || procesando} onClick={onConfirmar} className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] disabled:opacity-50">{procesando ? 'Procesando...' : 'Aplicar Cambios'}</button>
                </div>
            </div>
        </div>
    );
}
