import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import { formatearMoneda } from '@/utils/formatters';
import axios from 'axios';
import { emitToast } from '@/utils/toast';
import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

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
    clearPreview,
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
                <div className="flex items-start justify-between border-b border-gray-100 p-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">Confirmar cambios de fechas</h2>
                        <div className="mt-1 text-sm text-gray-500">Reservas · Localizador: <span className="font-semibold text-gray-700">{reserva?.localizador || '-'}</span></div>
                    </div>
                    <button onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-2 text-gray-400 hover:bg-gray-100">✕</button>
                </div>

                <div className="space-y-6 p-6">

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <div className="text-xs font-bold uppercase text-gray-400">Entrada (original)</div>
                            <div className="mt-2 text-sm font-semibold text-gray-800">{reserva?.check_in ? dayjs(reserva.check_in).format('dddd, D [de] MMMM [de] YYYY') : '-'}</div>
                            <div className="mt-1 text-xs text-gray-500">Salida original: <span className="font-medium text-gray-700">{reserva?.check_out ? dayjs(reserva.check_out).format('dddd, D [de] MMMM [de] YYYY') : '-'}</span></div>
                            {reserva?.check_in && reserva?.check_out && (
                                <div className="mt-2 text-xs text-gray-500">Duración: <span className="font-semibold text-gray-700">{dayjs(reserva.check_out).diff(dayjs(reserva.check_in), 'day')} noche{dayjs(reserva.check_out).diff(dayjs(reserva.check_in), 'day') !== 1 ? 's' : ''}</span></div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <div className="text-xs font-bold uppercase text-gray-400">Entrada (nueva)</div>
                            <div className="mt-2 text-sm font-semibold text-gray-800">{modalCheckIn ? dayjs(modalCheckIn).format('dddd, D [de] MMMM [de] YYYY') : '-'}</div>
                            <div className="mt-1 text-xs text-gray-500">Salida nueva: <span className="font-medium text-gray-700">{modalCheckOut ? dayjs(modalCheckOut).format('dddd, D [de] MMMM [de] YYYY') : '-'}</span></div>
                            {modalCheckIn && modalCheckOut && (
                                <div className="mt-2 text-xs text-gray-500">Duración: <span className="font-semibold text-gray-700">{dayjs(modalCheckOut).diff(dayjs(modalCheckIn), 'day')} noche{dayjs(modalCheckOut).diff(dayjs(modalCheckIn), 'day') !== 1 ? 's' : ''}</span></div>
                            )}
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

                                    {/* Mostrar aviso de penalización si aplica */}
                                    {Number(vistaPrevia.removed_nights || 0) > 0 && (
                                        <div className="mt-3 rounded-md border border-yellow-100 bg-yellow-50 p-3 text-sm text-yellow-800">
                                            <strong>Penalización:</strong> {formatearMoneda(vistaPrevia.penalizacion || 20)} aplicada sobre el reembolso. Si la penalización cubre el reembolso, no habrá devolución.
                                        </div>
                                    )}

                                    {/* Mostrar estado de disponibilidad */}
                                    <div className="mt-3 text-sm">
                                        <span className={`font-bold ${vistaPrevia.available ? 'text-green-600' : 'text-red-600'}`}>
                                            {vistaPrevia.available ? 'Disponible' : 'No disponible'}
                                        </span>
                                        {!vistaPrevia.available && (
                                            <div className="text-xs text-gray-500">Algunas habitaciones se solapan en las fechas seleccionadas.</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 bg-gray-50 p-8">
                    <button onClick={onCerrar} className="rounded-2xl border border-gray-200 bg-white py-4 px-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:bg-white/50">Cerrar</button>
                    <button
                        onClick={() => {
                            try {
                                if (typeof clearPreview === 'function') clearPreview();
                            } catch (e) {}
                            if (typeof setModalCheckIn === 'function' && typeof setModalCheckOut === 'function') {
                                setModalCheckIn(reserva?.check_in || '');
                                setModalCheckOut(reserva?.check_out || '');
                            }
                        }}
                        className="rounded-2xl border border-gray-200 bg-white py-4 px-4 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >Limpiar</button>
                    <ApplyButton
                        reserva={reserva}
                        modalCheckIn={modalCheckIn}
                        modalCheckOut={modalCheckOut}
                        disabled={!vistaPreviaCargada || !vistaPrevia?.available || procesando}
                        onSuccess={(resData) => {
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
