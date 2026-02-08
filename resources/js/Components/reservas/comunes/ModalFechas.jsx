import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { formatearMoneda } from '@/utils/formatters';
import axios from 'axios';
import { emitToast } from '@/utils/toast';
import { useState } from 'react';

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
    onApplied,
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

        // reducción de estancia -> mostrar reembolso bruto, penalización y neto
        const rawRefund = Math.max(0, Number(vistaPrevia.estimate_refund_raw ?? (vistaPrevia.viejo_total - vistaPrevia.nuevo_total)));
        const penalizacion = Number(vistaPrevia.penalizacion || 0);
        const finalRefund = Number(vistaPrevia.estimate_refund || 0);

        return (
            <div>
                <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Reembolso estimado (bruto)</span>
                <span className="text-2xl font-black text-green-600">-{formatearMoneda(rawRefund)}</span>

                <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Penalización</span>
                    <span className="text-xs font-bold text-gray-700">-{formatearMoneda(penalizacion)}</span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400">Reembolso neto</span>
                    <span className="text-lg font-black text-green-600">-{formatearMoneda(finalRefund)}</span>
                </div>

                {finalRefund <= 0 && penalizacion > 0 && (
                    <div className="mt-1 text-xs text-gray-400">La penalización cubre el reembolso — no se devuelve importe.</div>
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
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">HOLA PERRO</h2>
                    <button onClick={onCerrar} className="font-bold text-gray-400 hover:text-gray-600">✕</button>
                </div>

                    <div className="space-y-6 p-8">
                    <div className="text-center text-2xl font-bold text-gray-900">HOLA PERRO</div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Entrada (original)</label>
                            <div className="w-full rounded-xl border border-gray-200 bg-white p-2 font-bold">{reserva?.check_in || ''}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Salida (original)</label>
                            <div className="w-full rounded-xl border border-gray-200 bg-white p-2 font-bold">{reserva?.check_out || ''}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Entrada (nueva)</label>
                            <input
                                type="date"
                                disabled={isCheckedIn}
                                value={modalCheckIn}
                                onChange={(e) => setModalCheckIn(e.target.value)}
                                className="w-full rounded-xl border-gray-200 bg-gray-50 font-bold focus:border-[#7a0202] focus:ring-[#7a0202]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Salida (nueva)</label>
                            <input
                                type="date"
                                value={modalCheckOut}
                                onChange={(e) => setModalCheckOut(e.target.value)}
                                className="w-full rounded-xl border-gray-200 bg-gray-50 font-bold focus:border-[#7a0202] focus:ring-[#7a0202]"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-700">Precio original:</span>
                                <span className="font-black text-gray-900">{formatearMoneda(reserva?.precio_total ?? 0)}</span>
                            </div>
                            {vistaPrevia && vistaPreviaCargada && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-700">Precio nuevo:</span>
                                        <span className="font-black text-gray-900">{formatearMoneda(vistaPrevia.nuevo_total)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 bg-gray-50 p-8">
                    <button onClick={onCerrar} className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:bg-white/50">Cancelar</button>
                    <ApplyButton
                        reserva={reserva}
                        modalCheckIn={modalCheckIn}
                        modalCheckOut={modalCheckOut}
                        disabled={!vistaPreviaCargada || !vistaPrevia?.available || procesando}
                        onSuccess={(resData) => {
                            // invoke parent handler to update state instead of reloading
                            if (typeof onApplied === 'function') onApplied(resData);
                            else {
                                onCerrar && onCerrar();
                                window.location.reload();
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function ApplyButton({ reserva, modalCheckIn, modalCheckOut, disabled, onSuccess }) {
    const [applying, setApplying] = useState(false);

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    };

    const applyChanges = async () => {
        if (disabled || applying) return;
        setApplying(true);
        try {
            const payload = {
                check_in: modalCheckIn,
                check_out: modalCheckOut,
                status: reserva.status || 'pendiente',
                pago: typeof reserva.pago === 'string' ? reserva.pago : (reserva.pago?.estado ?? reserva.pago ?? 'pendiente'),
            };

            const xsrf = getCookie('XSRF-TOKEN');
            const res = await axios.put(`/reservas/${reserva.id}`, payload, {
                withCredentials: true,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                },
            });

            if (res?.data?.success) {
                emitToast('Fechas actualizadas', 'success');
                onSuccess && onSuccess(res.data);
            } else {
                emitToast(res?.data?.message || 'No se pudo actualizar', 'error');
            }
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error actualizando fechas';
            emitToast(msg, 'error');
        } finally {
            setApplying(false);
        }
    };

    return (
        <button disabled={disabled || applying} onClick={applyChanges} className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] disabled:opacity-50">{applying ? 'Aplicando...' : 'Aplicar Cambios'}</button>
    );
}
